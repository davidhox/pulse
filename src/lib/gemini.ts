import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { Article, SentimentSignal } from "./types";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

const NON_ENGLISH_LANGUAGES: Record<string, string> = {
  he: "Hebrew",
  is: "Icelandic",
  sq: "Albanian",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  tr: "Turkish",
  ar: "Arabic",
  pl: "Polish",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit =
        err instanceof Error && err.message.includes("429");
      if (isRateLimit && attempt < MAX_RETRIES) {
        console.warn(`[gemini] Rate limited, retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await delay(RETRY_DELAY_MS);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

const SIGNAL_ITEM_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    category: { type: SchemaType.STRING },
    severity: { type: SchemaType.STRING },
    label: { type: SchemaType.STRING },
    detail: { type: SchemaType.STRING },
  },
  required: ["category", "severity", "label"],
};

const TRANSLATE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    translation: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        summary: { type: SchemaType.STRING },
      },
      required: ["title", "summary"],
    },
    signals: {
      type: SchemaType.ARRAY,
      items: SIGNAL_ITEM_SCHEMA,
    },
  },
  required: ["translation", "signals"],
};

const SENTIMENT_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  items: SIGNAL_ITEM_SCHEMA,
};

async function processArticle(
  article: Article,
  client: GoogleGenerativeAI,
  skipTranslation?: boolean
): Promise<Article> {
  const needsTranslation =
    !skipTranslation && article.originalLanguage !== "en" && !article.isTranslated;

  if (needsTranslation) {
    const langName =
      NON_ENGLISH_LANGUAGES[article.originalLanguage] ||
      article.originalLanguage;

    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TRANSLATE_SCHEMA,
      },
    });

    const prompt = `You are analyzing a ${langName} sports article. Do TWO things:

1. TRANSLATE the title and summary to English.
2. ANALYZE for betting-relevant signals (injuries, suspensions, rotation, venue changes, travel fatigue, positive returns/form).

Category must be one of: injury, suspension, rotation, venue, travel, positive.
Severity must be one of: red (major impact), yellow (moderate), green (positive/minor).
If no betting signals, use an empty signals array.
If the summary is empty, translate only the title and set summary to "".

Title: ${article.title}
Summary: ${article.summary || "(empty)"}`;

    try {
      const result = await callWithRetry(() => model.generateContent(prompt));
      const parsed = JSON.parse(result.response.text());
      const signals = validateSignals(parsed.signals ?? []);

      return {
        ...article,
        originalTitle: article.title,
        originalSummary: article.summary,
        title: parsed.translation?.title || article.title,
        summary: parsed.translation?.summary || article.summary,
        isTranslated: true,
        sentimentSignals: signals,
        sentimentProcessed: true,
      };
    } catch (err) {
      console.error(
        `[gemini] Failed for "${article.title.slice(0, 40)}...":`,
        err instanceof Error ? err.message : err
      );
      return { ...article, sentimentProcessed: true };
    }
  } else {
    // English or skipTranslation — sentiment only
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SENTIMENT_SCHEMA,
      },
    });

    const prompt = `Analyze this sports article for betting-relevant signals.

Category must be one of: injury, suspension, rotation, venue, travel, positive.
Severity must be one of: red (major impact), yellow (moderate), green (positive/minor).
If no signals found, return an empty array.

Title: ${article.title}
Summary: ${article.summary || "(empty)"}`;

    try {
      const result = await callWithRetry(() => model.generateContent(prompt));
      const parsed = JSON.parse(result.response.text());
      const signals = validateSignals(Array.isArray(parsed) ? parsed : []);

      return {
        ...article,
        sentimentSignals: signals,
        sentimentProcessed: true,
      };
    } catch (err) {
      console.error(
        `[gemini] Sentiment failed for "${article.title.slice(0, 40)}...":`,
        err instanceof Error ? err.message : err
      );
      return { ...article, sentimentProcessed: true };
    }
  }
}

function validateSignals(raw: unknown[]): SentimentSignal[] {
  if (!Array.isArray(raw)) return [];

  const validCategories = new Set([
    "injury", "suspension", "rotation", "venue", "travel", "positive",
  ]);
  const validSeverities = new Set(["red", "yellow", "green"]);

  return raw.filter(
    (s): s is SentimentSignal =>
      s !== null &&
      typeof s === "object" &&
      validCategories.has((s as SentimentSignal).category) &&
      validSeverities.has((s as SentimentSignal).severity) &&
      typeof (s as SentimentSignal).label === "string"
  );
}

export async function processArticlesWithGemini(
  articles: Article[],
  skipTranslation?: boolean
): Promise<Article[]> {
  const client = getClient();
  if (!client) {
    console.warn("[gemini] No GEMINI_API_KEY set — skipping translation and sentiment");
    return articles;
  }

  // Skip entirely for non-English sources that don't need translation (e.g. Albanian)
  // These articles get no translation AND no sentiment analysis to save API costs
  if (skipTranslation && articles.length > 0 && articles[0].originalLanguage !== "en") {
    console.log(`[gemini] Skipping ${articles.length} non-English articles (skipTranslation)`);
    return articles;
  }

  const processed = [...articles];

  // Find indices of articles that still need processing
  const toProcess: number[] = [];
  for (let i = 0; i < processed.length; i++) {
    if (!processed[i].sentimentProcessed) {
      toProcess.push(i);
    }
  }

  if (toProcess.length === 0) {
    console.log("[gemini] All articles already processed, skipping");
    return processed;
  }

  console.log(`[gemini] Processing ${toProcess.length}/${processed.length} unprocessed articles`);

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batchIndices = toProcess.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batchIndices.map((idx) => processArticle(processed[idx], client, skipTranslation))
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled") {
        processed[batchIndices[j]] = (
          results[j] as PromiseFulfilledResult<Article>
        ).value;
      }
    }

    if (i + BATCH_SIZE < toProcess.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return processed;
}
