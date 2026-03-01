import { FeedSource } from "@/lib/types";

/**
 * ============================================
 *  PULSE — Feed Sources Configuration
 * ============================================
 *
 * Edit this file to add or remove RSS/Atom feed sources.
 * The app derives all navigation (countries, sports) from this list.
 *
 * Fields:
 *   id       — Unique slug (used for caching)
 *   name     — Display name of the source
 *   url      — RSS/Atom feed URL
 *   country  — Country code (lowercase, e.g. "gb", "us")
 *   sport    — Sport slug (e.g. "football", "basketball", "tennis")
 *   league   — Optional league name (e.g. "Premier League", "NBA")
 *   language — Language code (e.g. "en", "es")
 *   priority — 1 = highest, shown first when sources overlap
 */

export const feedSources: FeedSource[] = [
  // --- United Kingdom ---
  {
    id: "bbc-sport",
    name: "BBC Sport",
    url: "https://feeds.bbci.co.uk/sport/rss.xml",
    country: "gb",
    sport: "football",
    language: "en",
    priority: 1,
  },
  {
    id: "bbc-football",
    name: "BBC Football",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    country: "gb",
    sport: "football",
    league: "Premier League",
    language: "en",
    priority: 1,
  },
  {
    id: "bbc-tennis",
    name: "BBC Tennis",
    url: "https://feeds.bbci.co.uk/sport/tennis/rss.xml",
    country: "gb",
    sport: "tennis",
    language: "en",
    priority: 1,
  },
  {
    id: "bbc-basketball",
    name: "BBC Basketball",
    url: "https://feeds.bbci.co.uk/sport/basketball/rss.xml",
    country: "gb",
    sport: "basketball",
    language: "en",
    priority: 2,
  },

  // --- United States ---
  {
    id: "espn-top",
    name: "ESPN Top Headlines",
    url: "https://www.espn.com/espn/rss/news",
    country: "us",
    sport: "football",
    language: "en",
    priority: 1,
  },
  {
    id: "espn-nba",
    name: "ESPN NBA",
    url: "https://www.espn.com/espn/rss/nba/news",
    country: "us",
    sport: "basketball",
    league: "NBA",
    language: "en",
    priority: 1,
  },

  // --- Europe ---
  {
    id: "marca-futbol",
    name: "Marca Fútbol",
    url: "https://e00-marca.uecdn.es/rss/futbol/futbol.xml",
    country: "es",
    sport: "football",
    league: "La Liga",
    language: "es",
    priority: 1,
  },
  {
    id: "lequipe-foot",
    name: "L'Équipe Football",
    url: "https://dwh.lequipe.fr/api/edito/rss?path=/Football/",
    country: "fr",
    sport: "football",
    league: "Ligue 1",
    language: "fr",
    priority: 1,
  },
];
