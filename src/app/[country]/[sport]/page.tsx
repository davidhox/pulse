import { getArticles, getActiveCountries, getActiveSports, getSources } from "@/lib/feeds";
import { getCountry } from "@/data/countries";
import { getSport } from "@/data/sports";
import ArticleList from "@/components/ArticleList";
import SearchBar from "@/components/SearchBar";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function SportPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string; sport: string }>;
  searchParams: Promise<{ q?: string; source?: string; hours?: string }>;
}) {
  const { country: countryCode, sport: sportId } = await params;
  const sp = await searchParams;

  const activeCountries = getActiveCountries();
  if (!activeCountries.includes(countryCode)) notFound();

  const activeSports = getActiveSports(countryCode);
  if (!activeSports.includes(sportId)) notFound();

  const country = getCountry(countryCode);
  const sport = getSport(sportId);
  const sources = getSources(countryCode, sportId);

  const articles = await getArticles({
    country: countryCode,
    sport: sportId,
    source: sp.source,
    search: sp.q,
    hours: sp.hours ? parseInt(sp.hours) : undefined,
  });

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/${countryCode}`}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent mb-3 transition-colors"
        >
          <ChevronLeft size={14} />
          {country.name}
        </Link>
        <h1 className="text-2xl font-bold mb-1">
          {country.flag} {sport.name}
        </h1>
        <p className="text-sm text-muted">
          {articles.length} articles from {sources.length} sources
        </p>
      </div>

      {/* Source badges */}
      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {sources.map((s) => (
            <Link
              key={s.id}
              href={`/${countryCode}/${sportId}${sp.source === s.id ? "" : `?source=${s.id}`}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                sp.source === s.id
                  ? "bg-accent text-black"
                  : "bg-card border border-border text-muted hover:text-foreground"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-4">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <ArticleList
        articles={articles}
        emptyMessage={`No ${sport.name} articles for ${country.name}.`}
      />
    </>
  );
}
