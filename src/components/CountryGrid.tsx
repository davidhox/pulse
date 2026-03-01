import Link from "next/link";
import { getCountry } from "@/data/countries";

export default function CountryGrid({
  countryCodes,
}: {
  countryCodes: string[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {countryCodes.map((code) => {
        const country = getCountry(code);
        return (
          <Link
            key={code}
            href={`/${code}`}
            className="bg-card border border-border rounded-xl p-4 hover:bg-card-hover hover:border-accent/30 transition-all text-center group"
          >
            <span className="text-3xl block mb-2">{country.flag}</span>
            <span className="text-sm font-medium text-muted group-hover:text-foreground transition-colors">
              {country.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
