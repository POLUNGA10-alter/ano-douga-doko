import { NextRequest, NextResponse } from "next/server";
import { fetchVideoMetadata } from "@/lib/metadata-fetcher";
import { isSafeUrl } from "@/lib/validation";

/**
 * GET /api/metadata?url=...  - URLからメタ情報を取得
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: "Invalid or disallowed URL" }, { status: 400 });
  }

  try {
    const metadata = await fetchVideoMetadata(url);
    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
