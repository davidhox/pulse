import { Country } from "@/lib/types";

export const countries: Record<string, Country> = {
  gb: { code: "gb", name: "United Kingdom", flag: "🇬🇧" },
  us: { code: "us", name: "United States", flag: "🇺🇸" },
  es: { code: "es", name: "Spain", flag: "🇪🇸" },
  fr: { code: "fr", name: "France", flag: "🇫🇷" },
  de: { code: "de", name: "Germany", flag: "🇩🇪" },
  it: { code: "it", name: "Italy", flag: "🇮🇹" },
  pt: { code: "pt", name: "Portugal", flag: "🇵🇹" },
  nl: { code: "nl", name: "Netherlands", flag: "🇳🇱" },
  br: { code: "br", name: "Brazil", flag: "🇧🇷" },
  ar: { code: "ar", name: "Argentina", flag: "🇦🇷" },
  au: { code: "au", name: "Australia", flag: "🇦🇺" },
  tr: { code: "tr", name: "Turkey", flag: "🇹🇷" },
  gr: { code: "gr", name: "Greece", flag: "🇬🇷" },
  rs: { code: "rs", name: "Serbia", flag: "🇷🇸" },
  hr: { code: "hr", name: "Croatia", flag: "🇭🇷" },
  pl: { code: "pl", name: "Poland", flag: "🇵🇱" },
};

export function getCountry(code: string): Country {
  return countries[code] ?? { code, name: code.toUpperCase(), flag: "🏳️" };
}
