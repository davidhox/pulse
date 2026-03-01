import { Article } from "@/lib/types";
import ArticleCard from "./ArticleCard";

export default function ArticleList({
  articles,
  emptyMessage = "No articles found.",
}: {
  articles: Article[];
  emptyMessage?: string;
}) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
