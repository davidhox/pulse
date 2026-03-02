import { FeedSource } from "@/lib/types";

/**
 * ============================================
 *  PULSE — Feed Sources Configuration
 * ============================================
 *
 * Edit this file to add or remove feed sources.
 * The app derives all navigation (countries, sports) from this list.
 *
 * Fields:
 *   id            — Unique slug (used for caching)
 *   name          — Display name of the source
 *   url           — RSS feed URL or listing page URL (for scrape sources)
 *   country       — Country code (lowercase, e.g. "il", "is")
 *   sport         — Sport slug (e.g. "football", "basketball")
 *   league        — Optional league name
 *   language      — Language code (e.g. "en", "he", "is", "sq")
 *   priority      — 1 = highest, shown first when sources overlap
 *   type          — "rss" for RSS/Atom feeds, "scrape" for HTML scraping
 *   scraperConfig — Required for scrape sources: CSS selectors for extraction
 */

export const feedSources: FeedSource[] = [
  // --- Israel (Hebrew — scraped) ---
  {
    id: "doublepass",
    name: "Double Pass",
    url: "https://doublepass.sport5.co.il",
    country: "il",
    sport: "football",
    language: "he",
    priority: 1,
    type: "scrape",
    scraperConfig: {
      baseUrl: "https://doublepass.sport5.co.il",
      articleLinkSelector: 'a[href^="story.php?id="]',
      titleSelector: ".box_top h1",
      summarySelector: "strong.skyBlue, .box_center p",
      imageSelector: ".report_img_div img",
      dateSelector: ".report_page_date .flh_pad",
      followLinks: true,
    },
  },
  {
    id: "goler1",
    name: "Goler1",
    url: "https://www.goler1.co.il",
    country: "il",
    sport: "football",
    language: "he",
    priority: 2,
    type: "scrape",
    scraperConfig: {
      baseUrl: "https://www.goler1.co.il",
      articleLinkSelector:
        '#main_articles .slides a[href*="/Article/"], .articles_row a[href*="Article/"]',
      titleSelector: ".articel__details h2",
      summarySelector: ".articel__details h3",
      imageSelector: ".articel__details img",
      dateSelector: ".articel__meta li:nth-child(2)",
      dateFormat: "DD-MM-YYYY",
      followLinks: true,
    },
  },

  // --- Iceland (Icelandic — scraped) ---
  {
    id: "fotbolti",
    name: "Fotbolti.net",
    url: "https://fotbolti.net",
    country: "is",
    sport: "football",
    language: "is",
    priority: 1,
    type: "scrape",
    scraperConfig: {
      baseUrl: "https://fotbolti.net",
      articleLinkSelector:
        '#main-stories-carousel a[href^="/news/"], .news-list-row a[href^="/news/"]',
      titleSelector: ".story-title .story-title-icon",
      summarySelector: "#first-part",
      imageSelector: ".story-image img",
      dateSelector: ".story-header .date",
      followLinks: true,
    },
  },

  // --- Baltic States (English — RSS) ---
  {
    id: "baltic-football",
    name: "Baltic Football News",
    url: "https://balticfootballnews.com/feed/",
    country: "baltic",
    sport: "football",
    language: "en",
    priority: 1,
    type: "rss",
  },

  // --- Albania (Albanian — RSS) ---
  {
    id: "panorama-sport",
    name: "Panorama Sport",
    url: "https://panorama.com.al/sport/feed/",
    country: "al",
    sport: "football",
    language: "sq",
    priority: 1,
    type: "rss",
  },
];
