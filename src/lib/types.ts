export interface FeedSource {
  id: string;
  name: string;
  url: string;
  country: string;
  sport: string;
  league?: string;
  language: string;
  priority: number; // 1 = highest
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
