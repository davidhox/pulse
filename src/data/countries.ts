import { Country } from "@/lib/types";

export const countries: Record<string, Country> = {
  il: { code: "il", name: "Israel", flag: "\u{1F1EE}\u{1F1F1}" },
  is: { code: "is", name: "Iceland", flag: "\u{1F1EE}\u{1F1F8}" },
  al: { code: "al", name: "Albania", flag: "\u{1F1E6}\u{1F1F1}" },
  baltic: { code: "baltic", name: "Baltic States", flag: "\u{1F30D}" },
};

export function getCountry(code: string): Country {
  return countries[code] ?? { code, name: code.toUpperCase(), flag: "\u{1F3F3}\u{FE0F}" };
}
