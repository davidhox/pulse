import Link from "next/link";
import { Article } from "@/lib/types";
import { timeAgo, truncate } from "@/lib/utils";
import { getCountry } from "@/data/countries";
import { ExternalLink } from "lucide-react";

export default function ArticleCard({ article }: { article: Article }) {
  const country = getCountry(article.country);

  return (
    <article className="bg-card border border-border rounded-xl p-4 hover:bg-card-hover hover:border-accent/30 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-2 text-xs text-muted">
            <span>{country.flag}</span>
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
          <Link
            href={`/article/${article.id}`}
            className="block text-sm font-semibold leading-snug mb-1.5 group-hover:text-accent transition-colors"
          >
            {article.title}
          </Link>

          {/* Summary */}
          {article.summary && (
            <p className="text-xs text-muted leading-relaxed">
              {truncate(article.summary, 180)}
            </p>
          )}
        </div>

        {/* Thumbnail */}
        {article.imageUrl && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
        <span className="text-xs text-muted">{timeAgo(article.publishedAt)}</span>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
        >
          Read original <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}
