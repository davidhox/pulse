import { getArticles, getActiveCountries, getActiveSports } from "@/lib/feeds";
import ArticleList from "@/components/ArticleList";
import CountryGrid from "@/components/CountryGrid";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sport?: string; hours?: string }>;
}) {
  const params = await searchParams;
  const countryCodes = getActiveCountries();
  const sports = getActiveSports();

  const articles = await getArticles({
    search: params.q,
    sport: params.sport,
    hours: params.hours ? parseInt(params.hours) : undefined,
  });

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">All News</h1>
        <p className="text-sm text-muted">
          {articles.length} articles from {countryCodes.length} countries
        </p>
      </div>

      {/* Country grid */}
      <div className="mb-8">
        <CountryGrid countryCodes={countryCodes} />
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <FilterBar
            sports={sports}
            currentSport={params.sport}
            currentHours={params.hours ? parseInt(params.hours) : undefined}
          />
        </Suspense>
      </div>

      {/* Article feed */}
      <ArticleList
        articles={articles}
        emptyMessage="No articles yet. Check your feed sources in feeds.config.ts."
      />
    </>
  );
}
