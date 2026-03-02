import { GoogleGenerativeAI } from "@google/generative-ai";
import { Article, SentimentSignal } from "./types";

// Free tier: 5 requests/min for gemini-2.5-flash
// Process 2 articles per batch, 15s between batches = ~4 req/min (safe margin)
const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 10000;

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

/**
 * Single Gemini call that handles both translation and sentiment analysis.
 * Reduces API calls from 2 per article to 1.
 */
async function processArticle(
  article: Article,
  client: GoogleGenerativeAI
): Promise<Article> {
  const needsTranslation =
    article.originalLanguage !== "en" && !article.isTranslated;

  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

  if (needsTranslation) {
    const langName =
      NON_ENGLISH_LANGUAGES[article.originalLanguage] ||
      article.originalLanguage;

    const prompt = `You are analyzing a ${langName} sports article. Do TWO things:

1. TRANSLATE the title and summary to English.
2. ANALYZE for betting-relevant signals (injuries, suspensions, rotation, venue changes, travel fatigue, positive returns/form).

Return ONLY valid JSON (no markdown fences), in this exact format:
{
  "translation": { "title": "...", "summary": "..." },
  "signals": [
    { "category": "injury|suspension|rotation|venue|travel|positive", "severity": "red|yellow|green", "label": "2-4 words", "detail": "one sentence" }
  ]
}

If no betting signals, use "signals": [].
If the summary is empty, translate only the title and set summary to "".

Title: ${article.title}
Summary: ${article.summary || "(empty)"}`;

    try {
      const result = await callWithRetry(() => model.generateContent(prompt));
      const text = result.response.text().trim();
      const jsonStr = text.replace(/^```json?\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(jsonStr);

      const signals = validateSignals(parsed.signals);

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
    // English article — sentiment only
    const prompt = `Analyze this sports article for betting-relevant signals. Return ONLY a valid JSON array (no markdown fences). Each item: { "category": "injury|suspension|rotation|venue|travel|positive", "severity": "red|yellow|green", "label": "2-4 words", "detail": "one sentence" }.

If no signals, return [].

Title: ${article.title}
Summary: ${article.summary || "(empty)"}`;

    try {
      const result = await callWithRetry(() => model.generateContent(prompt));
      const text = result.response.text().trim();
      const jsonStr = text.replace(/^```json?\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(jsonStr);

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
    "injury",
    "suspension",
    "rotation",
    "venue",
    "travel",
    "positive",
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
  articles: Article[]
): Promise<Article[]> {
  const client = getClient();
  if (!client) {
    console.warn(
      "[gemini] No GEMINI_API_KEY set — skipping translation and sentiment"
    );
    return articles;
  }

  const processed = [...articles];

  for (let i = 0; i < processed.length; i += BATCH_SIZE) {
    const batchIndices = [];
    for (let j = i; j < Math.min(i + BATCH_SIZE, processed.length); j++) {
      batchIndices.push(j);
    }

    const results = await Promise.allSettled(
      batchIndices.map((idx) => processArticle(processed[idx], client))
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled") {
        processed[batchIndices[j]] = (
          results[j] as PromiseFulfilledResult<Article>
        ).value;
      }
    }

    // Delay between batches to stay within rate limits
    if (i + BATCH_SIZE < processed.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return processed;
}
