import Parser from "rss-parser";
import { feedSources } from "@/data/feeds.config";
import { Article, CachedFeed, FeedFilters, FeedSource } from "./types";
import { getCached, getStale, isFresh, setCache } from "./cache";
import { hashId, stripHtml } from "./utils";
import { scrapeSource } from "./scraper";
import { processArticlesWithGemini } from "./gemini";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "PULSE/1.0 (Sports News Aggregator)",
  },
});

function normalizeRssArticles(
  feed: Parser.Output<Record<string, unknown>>,
  source: FeedSource
): Article[] {
  return (feed.items ?? []).map((item) => {
    const link = item.link ?? "";
    const id = hashId(`${source.id}:${link || item.title || ""}`);

    // Try to extract image from various RSS fields
    let imageUrl: string | undefined;
    const mediaContent = item["media:content"] as
      | { $?: { url?: string } }
      | undefined;
    if (mediaContent?.$?.url) {
      imageUrl = mediaContent.$.url;
    }
    const mediaThumbnail = item["media:thumbnail"] as
      | { $?: { url?: string } }
      | undefined;
    if (!imageUrl && mediaThumbnail?.$?.url) {
      imageUrl = mediaThumbnail.$.url;
    }
    const enclosure = item.enclosure as { url?: string; type?: string } | undefined;
    if (!imageUrl && enclosure?.url && enclosure.type?.startsWith("image")) {
      imageUrl = enclosure.url;
    }

    return {
      id,
      title: item.title ?? "Untitled",
      summary: stripHtml(
        item.contentSnippet ?? item.content ?? item.summary ?? ""
      ),
      link,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      source: { id: source.id, name: source.name },
      country: source.country,
      sport: source.sport,
      league: source.league,
      imageUrl,
      originalLanguage: source.language,
      isTranslated: false,
      sentimentSignals: [],
      sentimentProcessed: false,
    };
  });
}

async function fetchSource(source: FeedSource): Promise<CachedFeed> {
  let articles: Article[];

  if (source.type === "scrape") {
    articles = await scrapeSource(source);
  } else {
    const feed = await parser.parseURL(source.url);
    articles = normalizeRssArticles(feed, source);
  }

  // Apply keyword filters if configured
  if (source.filterKeywords && source.filterKeywords.length > 0) {
    const keywords = source.filterKeywords.map((k) => k.toLowerCase());
    articles = articles.filter((a) => {
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
  }
  if (source.excludeKeywords && source.excludeKeywords.length > 0) {
    const excluded = source.excludeKeywords.map((k) => k.toLowerCase());
    articles = articles.filter((a) => {
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return !excluded.some((kw) => text.includes(kw));
    });
  }

  // Cache raw articles immediately so page loads aren't blocked
  const cached: CachedFeed = {
    articles,
    fetchedAt: Date.now(),
    sourceId: source.id,
  };
  setCache(source.id, cached);

  // Process through Gemini in background (translation + sentiment)
  // Updates cache when done — next page load gets enriched articles
  processArticlesWithGemini(articles, source.skipTranslation).then((enriched) => {
    const translated = enriched.filter((a) => a.isTranslated).length;
    const withSignals = enriched.filter((a) => a.sentimentSignals.length > 0).length;
    console.log(`[gemini] Done ${source.id}: ${translated} translated, ${withSignals} with signals`);
    setCache(source.id, { ...cached, articles: enriched });
  }).catch((err) => {
    console.error(`[gemini] Background processing failed for ${source.id}:`, err);
  });

  return cached;
}

async function getSourceArticles(source: FeedSource): Promise<Article[]> {
  // Return fresh cache if available
  if (isFresh(source.id)) {
    return getCached(source.id)!.articles;
  }

  // Stale-while-revalidate: return stale data, refresh in background
  const stale = getStale(source.id);
  if (stale) {
    // Fire-and-forget background refresh
    fetchSource(source).catch(() => {});
    return stale.articles;
  }

  // No cache at all — must fetch
  try {
    const cached = await fetchSource(source);
    return cached.articles;
  } catch (err) {
    console.error(`[feeds] Failed to fetch ${source.name}:`, err);
    return [];
  }
}

export async function getArticles(filters?: FeedFilters): Promise<Article[]> {
  let sources = feedSources;

  // Pre-filter sources by country/sport to avoid unnecessary fetches
  if (filters?.country) {
    sources = sources.filter((s) => s.country === filters.country);
  }
  if (filters?.sport) {
    sources = sources.filter((s) => s.sport === filters.sport);
  }
  if (filters?.source) {
    sources = sources.filter((s) => s.id === filters.source);
  }

  // Fetch all sources in parallel — one failure doesn't block others
  const results = await Promise.allSettled(
    sources.map((source) => getSourceArticles(source))
  );

  let articles: Article[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  // Apply text search filter
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q)
    );
  }

  // Apply time filter
  if (filters?.hours) {
    const cutoff = Date.now() - filters.hours * 60 * 60 * 1000;
    articles = articles.filter(
      (a) => new Date(a.publishedAt).getTime() > cutoff
    );
  }

  // Deduplicate by link
  const seen = new Set<string>();
  articles = articles.filter((a) => {
    if (!a.link || seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  // Sort by publish date (newest first)
  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return articles;
}

/** Get the list of active countries derived from feed config */
export function getActiveCountries(): string[] {
  return [...new Set(feedSources.map((s) => s.country))];
}

/** Get the list of active sports for a given country (or all) */
export function getActiveSports(country?: string): string[] {
  let sources = feedSources;
  if (country) {
    sources = sources.filter((s) => s.country === country);
  }
  return [...new Set(sources.map((s) => s.sport))];
}

/** Get all feed sources (for filter UI) */
export function getSources(country?: string, sport?: string): FeedSource[] {
  let sources = feedSources;
  if (country) sources = sources.filter((s) => s.country === country);
  if (sport) sources = sources.filter((s) => s.sport === sport);
  return sources;
}
