export interface ScraperConfig {
  baseUrl: string;
  articleLinkSelector: string;
  titleSelector: string;
  summarySelector?: string;
  imageSelector?: string;
  dateSelector?: string;
  dateFormat?: string;
  followLinks?: boolean;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  country: string;
  sport: string;
  league?: string;
  language: string;
  priority: number; // 1 = highest
  type: "rss" | "scrape";
  scraperConfig?: ScraperConfig;
  /** Only keep articles whose title or summary contain at least one keyword (case-insensitive) */
  filterKeywords?: string[];
  /** Drop articles whose title or summary contain any of these keywords (case-insensitive) */
  excludeKeywords?: string[];
  /** Skip Gemini translation even if non-English */
  skipTranslation?: boolean;
}

export type SentimentCategory =
  | "injury"
  | "suspension"
  | "rotation"
  | "venue"
  | "travel"
  | "positive";

export type SentimentSeverity = "red" | "yellow" | "green";

export interface SentimentSignal {
  category: SentimentCategory;
  severity: SentimentSeverity;
  label: string;
  detail?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  country: string;
  sport: string;
  league?: string;
  imageUrl?: string;
  originalLanguage: string;
  originalTitle?: string;
  originalSummary?: string;
  isTranslated: boolean;
  sentimentSignals: SentimentSignal[];
  sentimentProcessed: boolean;
}

export interface CachedFeed {
  articles: Article[];
  fetchedAt: number;
  sourceId: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string; // lucide icon name
}

export interface FeedFilters {
  country?: string;
  sport?: string;
  search?: string;
  source?: string;
  hours?: number; // only articles from last N hours
}
