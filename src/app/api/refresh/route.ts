import { NextRequest, NextResponse } from "next/server";
import { bustCache } from "@/lib/cache";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sourceId = (body as { sourceId?: string }).sourceId;

  bustCache(sourceId);

  return NextResponse.json({
    ok: true,
    message: sourceId
      ? `Cache busted for source: ${sourceId}`
      : "All caches busted",
  });
}
