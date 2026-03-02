import { getArticles } from "@/lib/feeds";
import { getCountry } from "@/data/countries";
import { timeAgo } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Clock, Languages } from "lucide-react";
import SentimentBadges from "@/components/SentimentBadges";

export const dynamic = "force-dynamic";

const RTL_LANGUAGES = new Set(["he", "ar"]);

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch all articles and find the matching one
  const allArticles = await getArticles();
  const article = allArticles.find((a) => a.id === id);

  if (!article) notFound();

  const country = getCountry(article.country);
  const isRtl = RTL_LANGUAGES.has(article.originalLanguage);

  return (
    <>
      {/* Back link */}
      <Link
        href={`/${article.country}`}
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent mb-6 transition-colors"
      >
        <ChevronLeft size={14} />
        Back to {country.name}
      </Link>

      <article className="bg-card border border-border rounded-xl p-6">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-muted">
          <span>{country.flag} {country.name}</span>
          <span className="text-border">|</span>
          <span className="capitalize">{article.sport}</span>
          {article.league && (
            <>
              <span className="text-border">|</span>
              <span>{article.league}</span>
            </>
          )}
          <span className="text-border">|</span>
          <span>{article.source.name}</span>
          {article.isTranslated && (
            <>
              <span className="text-border">|</span>
              <span className="inline-flex items-center gap-1 text-accent/70">
                <Languages size={12} />
                Translated from {article.originalLanguage.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold leading-tight mb-4">{article.title}</h1>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-muted mb-6">
          <Clock size={13} />
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            ({timeAgo(article.publishedAt)})
          </time>
        </div>

        {/* Betting Signals */}
        {article.sentimentSignals && article.sentimentSignals.length > 0 && (
          <div className="mb-6 bg-background/50 border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-3 text-foreground/80">
              Betting Signals
            </h2>
            <SentimentBadges signals={article.sentimentSignals} compact={false} />
          </div>
        )}

        {/* Image */}
        {article.imageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              className="w-full max-h-80 object-cover"
            />
          </div>
        )}

        {/* Summary */}
        {article.summary && (
          <div className="text-sm leading-relaxed text-foreground/90 mb-6 whitespace-pre-line">
            {article.summary}
          </div>
        )}

        {/* Original text (for translated articles) */}
        {article.isTranslated && (article.originalTitle || article.originalSummary) && (
          <details className="mb-6 border border-border/50 rounded-lg">
            <summary className="px-4 py-3 text-xs text-muted cursor-pointer hover:text-foreground transition-colors">
              View original ({article.originalLanguage.toUpperCase()})
            </summary>
            <div
              className="px-4 pb-4 text-sm text-muted leading-relaxed"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {article.originalTitle && (
                <p className="font-semibold mb-2">{article.originalTitle}</p>
              )}
              {article.originalSummary && (
                <p className="whitespace-pre-line">{article.originalSummary}</p>
              )}
            </div>
          </details>
        )}

        {/* CTA */}
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          Read full article <ExternalLink size={14} />
        </a>
      </article>
    </>
  );
}
