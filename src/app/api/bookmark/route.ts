import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchVideoMetadata } from "@/lib/metadata-fetcher";
import { detectPlatform, detectContentType } from "@/lib/platform-detector";
import {
  isValidUserId,
  isValidBookmarkId,
  isValidTags,
  isValidMemo,
  isValidTitle,
  isValidHttpUrl,
  isSafeUrl,
} from "@/lib/validation";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables are not set");
  }
  return createClient(url, key);
}

/** URLを正規化（末尾スラッシュ除去、トラッキングパラメータ削除等） */
function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());

    // YouTube の場合、不要なパラメータを除去（si, feature 等）
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      const keepParams = ["v", "t", "list", "index"];
      const newParams = new URLSearchParams();
      for (const key of keepParams) {
        const val = url.searchParams.get(key);
        if (val) newParams.set(key, val);
      }
      url.search = newParams.toString() ? `?${newParams.toString()}` : "";
    }

    return url.href;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * GET /api/bookmark - ブックマーク一覧取得
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!isValidUserId(userId)) {
    return NextResponse.json({ error: "Invalid user_id" }, { status: 400 });
  }

  const tag = searchParams.get("tag");
  const platform = searchParams.get("platform");

  try {
    const supabase = getSupabase();
    let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookmark - ブックマーク保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url: rawUrl, user_id, tags = [], memo = "" } = body;

    if (!rawUrl || !isValidUserId(user_id)) {
      return NextResponse.json(
        { error: "Valid url and user_id (UUID) are required" },
        { status: 400 }
      );
    }

    // 入力型検証
    if (!isValidTags(tags)) {
      return NextResponse.json(
        { error: "tags must be an array of strings (max 20 tags, each max 50 chars)" },
        { status: 400 }
      );
    }
    if (!isValidMemo(memo)) {
      return NextResponse.json(
        { error: "memo must be a string (max 2000 chars)" },
        { status: 400 }
      );
    }

    // URLバリデーション
    if (!isValidHttpUrl(rawUrl)) {
      return NextResponse.json(
        { error: "有効なURL（http:// または https://）を入力してください" },
        { status: 400 }
      );
    }

    // URL正規化
    const url = normalizeUrl(rawUrl);

    // SSRF対策: プライベートIP / localhost をブロック
    if (!isSafeUrl(url)) {
      return NextResponse.json(
        { error: "このURLにはアクセスできません" },
        { status: 400 }
      );
    }

    // 重複URL検出
    const supabaseCheck = getSupabase();
    const { data: existing } = await supabaseCheck
      .from("bookmarks")
      .select("id, title")
      .eq("user_id", user_id)
      .eq("url", url)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        {
          error: "このURLは既に保存されています",
          duplicate: true,
          existingBookmark: existing[0],
        },
        { status: 409 }
      );
    }

    // プラットフォーム・コンテンツ種別を判定
    const platform = detectPlatform(url);
    const contentType = detectContentType(url);

    // メタ情報を取得（失敗してもエラーにしない = URLだけでも保存可能）
    const metadata = await fetchVideoMetadata(url);

    // メタ情報からcontentTypeを昇格（ページ内動画が検出された場合）
    const finalContentType = metadata.contentType || contentType;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id,
        url,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        platform,
        content_type: finalContentType,
        duration: metadata.duration,
        site_name: metadata.siteName,
        video_url: metadata.videoUrl,
        video_source: metadata.videoSource,
        tags,
        memo,
      })
      .select()
      .single();

    if (error) {
      // UNIQUE制約違反（削除→再保存のレース or 正規化差分）の場合は重複として扱う
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error: "このURLは既に保存されています",
            duplicate: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      bookmark: data,
      meta: {
        fetchSuccess: metadata.fetchSuccess,
        fetchError: metadata.fetchError,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/bookmark - ブックマーク削除
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("user_id");

  if (!isValidBookmarkId(id) || !isValidUserId(userId)) {
    return NextResponse.json(
      { error: "Valid id and user_id (UUID) are required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookmark - ブックマーク編集（タイトル・メモ・タグ）
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, title, memo, tags } = body;

    if (!isValidBookmarkId(id) || !isValidUserId(user_id)) {
      return NextResponse.json(
        { error: "Valid id and user_id (UUID) are required" },
        { status: 400 }
      );
    }

    // 更新値の型検証
    if (title !== undefined && !isValidTitle(title)) {
      return NextResponse.json(
        { error: "title must be a string (max 500 chars)" },
        { status: 400 }
      );
    }
    if (memo !== undefined && !isValidMemo(memo)) {
      return NextResponse.json(
        { error: "memo must be a string (max 2000 chars)" },
        { status: 400 }
      );
    }
    if (tags !== undefined && !isValidTags(tags)) {
      return NextResponse.json(
        { error: "tags must be an array of strings" },
        { status: 400 }
      );
    }

    // 更新対象のフィールドだけ構築
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (memo !== undefined) updates.memo = memo;
    if (tags !== undefined) updates.tags = tags;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "更新するフィールドがありません" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("bookmarks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) {
      // 該当行が0件の場合（PGRST116）→ 404
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "ブックマークが見つかりません" },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmark: data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
