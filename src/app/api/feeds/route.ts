import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/feeds";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const articles = await getArticles({
    country: searchParams.get("country") ?? undefined,
    sport: searchParams.get("sport") ?? undefined,
    search: searchParams.get("q") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    hours: searchParams.get("hours")
      ? parseInt(searchParams.get("hours")!)
      : undefined,
  });

  return NextResponse.json({
    count: articles.length,
    articles,
  });
}
