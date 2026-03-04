import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables are not set");
  }
  return createClient(url, key);
}

/**
 * POST /api/bookmark/reorder - ブックマークの並び順を一括更新
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, items } = body as {
      user_id: string;
      items: { id: string; sort_order: number }[];
    };

    if (!user_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "user_id and items[] are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 一括更新（各アイテムのsort_orderを更新）
    const promises = items.map(({ id, sort_order }) =>
      supabase
        .from("bookmarks")
        .update({ sort_order })
        .eq("id", id)
        .eq("user_id", user_id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Some updates failed", details: errors.map((e) => e.error?.message) },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, updated: items.length });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
