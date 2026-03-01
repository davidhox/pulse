import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-5xl font-bold text-accent mb-4">404</h1>
      <p className="text-muted mb-8">Page not found</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-card border border-border hover:border-accent/30 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        <Home size={16} /> Back to home
      </Link>
    </div>
  );
}
