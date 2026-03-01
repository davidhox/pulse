import { getArticles } from "@/lib/feeds";
import { getCountry } from "@/data/countries";
import { timeAgo } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

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
