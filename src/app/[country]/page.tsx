import { getArticles, getActiveSports } from "@/lib/feeds";
import { getCountry } from "@/data/countries";
import ArticleList from "@/components/ArticleList";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { notFound } from "next/navigation";
import { getActiveCountries } from "@/lib/feeds";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ q?: string; sport?: string; hours?: string }>;
}) {
  const { country: countryCode } = await params;
  const sp = await searchParams;

  // Validate country exists in our feeds
  const activeCountries = getActiveCountries();
  if (!activeCountries.includes(countryCode)) {
    notFound();
  }

  const country = getCountry(countryCode);
  const sports = getActiveSports(countryCode);

  const articles = await getArticles({
    country: countryCode,
    sport: sp.sport,
    search: sp.q,
    hours: sp.hours ? parseInt(sp.hours) : undefined,
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          {country.flag} {country.name}
        </h1>
        <p className="text-sm text-muted">
          {articles.length} articles across {sports.length} sports
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <Suspense>
          <SearchBar />
        </Suspense>
        <Suspense>
          <FilterBar
            sports={sports}
            currentSport={sp.sport}
            currentHours={sp.hours ? parseInt(sp.hours) : undefined}
          />
        </Suspense>
      </div>

      <ArticleList
        articles={articles}
        emptyMessage={`No articles found for ${country.name}.`}
      />
    </>
  );
}
