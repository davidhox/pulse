import * as cheerio from "cheerio";
import { Article, FeedSource } from "./types";
import { hashId, stripHtml } from "./utils";

const MAX_ARTICLES = 20;
const BATCH_SIZE = 5;
const USER_AGENT = "PULSE/1.0 (Sports News Aggregator)";
const FETCH_TIMEOUT = 10000;

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

// Icelandic month names → month number
const ICELANDIC_MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mars: "03", apr: "04", maí: "05", jún: "06",
  júl: "07", ágú: "08", sep: "09", okt: "10", nóv: "11", des: "12",
  janúar: "01", febrúar: "02", mars2: "03", apríl: "04",
  júní: "06", júlí: "07", ágúst: "08", september: "09",
  október: "10", nóvember: "11", desember: "12",
};

function parseDate(dateStr: string, format?: string): string {
  if (!dateStr) return new Date().toISOString();

  const trimmed = dateStr.trim();

  // DD-MM-YYYY or DD.MM.YYYY format
  if (format === "DD-MM-YYYY") {
    const match = trimmed.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
    if (match) {
      const [, day, month, yearStr] = match;
      const year = yearStr.length === 2 ? `20${yearStr}` : yearStr;
      return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`).toISOString();
    }
  }

  // Double Pass format: "מאת: Author | DD.MM.YY | HH:MM"
  const dpMatch = trimmed.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})\s*\|\s*(\d{2}):(\d{2})/);
  if (dpMatch) {
    const [, day, month, year, hour, minute] = dpMatch;
    return new Date(`20${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour}:${minute}:00`).toISOString();
  }

  // Fotbolti format: "sun 01. mars 2026 23:04"
  const fotboltiMatch = trimmed.match(/(\d{1,2})\.\s*(\w+)\s+(\d{4})\s+(\d{2}):(\d{2})/);
  if (fotboltiMatch) {
    const [, day, monthName, year, hour, minute] = fotboltiMatch;
    const monthNum = ICELANDIC_MONTHS[monthName.toLowerCase()] || "01";
    return new Date(`${year}-${monthNum}-${day.padStart(2, "0")}T${hour}:${minute}:00`).toISOString();
  }

  // Try native parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchDetailPage(
  url: string,
  source: FeedSource
): Promise<Partial<Article> | null> {
  const config = source.scraperConfig!;

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const title = $(config.titleSelector).first().text().trim();
    if (!title) return null;

    let summary = "";
    if (config.summarySelector) {
      const paragraphs: string[] = [];
      $(config.summarySelector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && paragraphs.length < 3) {
          paragraphs.push(text);
        }
      });
      summary = paragraphs.join(" ");
    }

    let imageUrl: string | undefined;
    if (config.imageSelector) {
      const imgSrc =
        $(config.imageSelector).first().attr("src") ||
        $(config.imageSelector).first().attr("data-src");
      if (imgSrc) {
        imageUrl = resolveUrl(imgSrc, config.baseUrl);
      }
    }

    let publishedAt = new Date().toISOString();
    if (config.dateSelector) {
      const dateText =
        $(config.dateSelector).first().attr("datetime") ||
        $(config.dateSelector).first().text();
      if (dateText) {
        publishedAt = parseDate(dateText, config.dateFormat);
      }
    }

    return {
      title,
      summary: stripHtml(summary),
      imageUrl,
      publishedAt,
    };
  } catch {
    return null;
  }
}

export async function scrapeSource(source: FeedSource): Promise<Article[]> {
  const config = source.scraperConfig;
  if (!config) return [];

  try {
    const html = await fetchPage(source.url);
    const $ = cheerio.load(html);

    // Extract article links from listing page
    const links: string[] = [];
    $(config.articleLinkSelector).each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const fullUrl = resolveUrl(href, config.baseUrl);
        if (!links.includes(fullUrl)) {
          links.push(fullUrl);
        }
      }
    });

    const articleLinks = links.slice(0, MAX_ARTICLES);

    if (config.followLinks && articleLinks.length > 0) {
      // Fetch detail pages in batches
      const articles: Article[] = [];

      for (let i = 0; i < articleLinks.length; i += BATCH_SIZE) {
        const batch = articleLinks.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((url) => fetchDetailPage(url, source))
        );

        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === "fulfilled" && result.value) {
            const detail = result.value;
            const link = batch[j];
            const id = hashId(`${source.id}:${link}`);

            articles.push({
              id,
              title: detail.title || "Untitled",
              summary: detail.summary || "",
              link,
              publishedAt: detail.publishedAt || new Date().toISOString(),
              source: { id: source.id, name: source.name },
              country: source.country,
              sport: source.sport,
              league: source.league,
              imageUrl: detail.imageUrl,
              originalLanguage: source.language,
              isTranslated: false,
              sentimentSignals: [],
              sentimentProcessed: false,
            });
          }
        }
      }

      return articles;
    }

    // No followLinks — extract from listing page only
    const articles: Article[] = [];
    $(config.articleLinkSelector)
      .slice(0, MAX_ARTICLES)
      .each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href");
        if (!href) return;

        const link = resolveUrl(href, config.baseUrl);
        const title = $el.text().trim() || $el.attr("title") || "Untitled";
        const id = hashId(`${source.id}:${link}`);

        articles.push({
          id,
          title,
          summary: "",
          link,
          publishedAt: new Date().toISOString(),
          source: { id: source.id, name: source.name },
          country: source.country,
          sport: source.sport,
          league: source.league,
          originalLanguage: source.language,
          isTranslated: false,
          sentimentSignals: [],
          sentimentProcessed: false,
        });
      });

    return articles;
  } catch (err) {
    console.error(`[scraper] Failed to scrape ${source.name}:`, err);
    return [];
  }
}
