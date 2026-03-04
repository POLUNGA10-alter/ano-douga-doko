import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not set");
  return createClient(url, key);
}

/**
 * POST /api/share-collection
 * 選択されたブックマークIDからシェア用データを生成
 *
 * Body: { user_id: string, bookmark_ids: string[] }
 * Returns: { shareUrl: string, data: SharedBookmark[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { user_id, bookmark_ids } = await request.json();

    if (!user_id || !bookmark_ids?.length) {
      return NextResponse.json(
        { error: "user_id and bookmark_ids are required" },
        { status: 400 }
      );
    }

    if (bookmark_ids.length > 50) {
      return NextResponse.json(
        { error: "一度にシェアできるのは最大50件です" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("bookmarks")
      .select("url, title, thumbnail, platform, content_type, duration, tags, site_name")
      .eq("user_id", user_id)
      .in("id", bookmark_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "ブックマークが見つかりません" }, { status: 404 });
    }

    // データを軽量化してBase64エンコード
    const compact = data.map((b) => ({
      u: b.url,
      t: b.title || "",
      th: b.thumbnail || "",
      p: b.platform,
      ct: b.content_type,
      d: b.duration || "",
      tg: b.tags || [],
      s: b.site_name || "",
    }));

    const jsonStr = JSON.stringify(compact);
    const encoded = Buffer.from(jsonStr).toString("base64url");

    // URLが長すぎる場合（2000文字超え）はエラー
    const baseUrl = new URL(request.url).origin;
    const shareUrl = `${baseUrl}/shared?d=${encoded}`;

    if (shareUrl.length > 8000) {
      return NextResponse.json(
        { error: "シェアするブックマーク数が多すぎます。件数を減らしてください。" },
        { status: 400 }
      );
    }

    return NextResponse.json({ shareUrl, count: data.length });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
