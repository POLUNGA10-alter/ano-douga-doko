import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchVideoMetadata } from "@/lib/metadata-fetcher";
import { detectPlatform, detectContentType } from "@/lib/platform-detector";
import { isValidUserId, isSafeUrl } from "@/lib/validation";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env not set");
  return createClient(url, key);
}

/** URLを正規化 */
function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
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
 * GET /api/bookmark/quick?user_id=...&url=...
 * ブックマークレット / iOSショートカット からのワンクリック保存
 * Supabase に直接保存（内部fetch不要）
 */
export async function GET(request: NextRequest) {
  const fullUrl = request.url;
  const { searchParams } = new URL(fullUrl);
  const userId = searchParams.get("user_id");

  // URL取得: まず標準パース（エンコード済み対応）、次にiOSショートカット用の生パース
  let url = searchParams.get("url");
  // iOSショートカットがURLをエンコードせずに結合するケース: 生パースからも抽出して長い方を採用
  const rawUrl = extractUrlParam(fullUrl);
  if (rawUrl && (!url || rawUrl.length > url.length)) {
    url = rawUrl;
  }
  if (!url && rawUrl) {
    url = rawUrl;
  }
  // extractUrlParam がエンコード済みURLを返した場合にデコード
  if (url && url.includes("%3A%2F%2F")) {
    try { url = decodeURIComponent(url); } catch { /* そのまま使う */ }
  }

  // YouTubeアプリ等が「タイトル\nURL」形式で共有するケースに対応
  // テキスト中からhttpで始まるURLを抽出する
  if (url) {
    url = extractFirstUrl(url);
  }

  if (!url || !userId) {
    return new NextResponse(
      generateHTML("❌ エラー", "URLまたはユーザーIDが不足しています。", url, userId, fullUrl),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // user_id UUID検証
  if (!isValidUserId(userId)) {
    return new NextResponse(
      generateHTML("❌ エラー", "ユーザーIDの形式が不正です。", url, userId),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    // URL正規化
    const normalizedUrl = normalizeUrl(url);

    // URLバリデーション
    try {
      const parsed = new URL(normalizedUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return new NextResponse(
          generateHTML("❌ エラー", "有効なURLではありません。", normalizedUrl, userId),
          { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
    } catch {
      return new NextResponse(
        generateHTML("❌ エラー", `URLの形式が正しくありません: ${escapeHtml(url)}`, url, userId),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // SSRF対策: プライベートIP / localhost をブロック
    if (!isSafeUrl(normalizedUrl)) {
      return new NextResponse(
        generateHTML("❌ エラー", "このURLにはアクセスできません。", normalizedUrl, userId),
        { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const supabase = getSupabase();

    // 重複チェック
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id, title")
      .eq("user_id", userId)
      .eq("url", normalizedUrl)
      .limit(1);

    if (existing && existing.length > 0) {
      return new NextResponse(
        generateHTML("⚠️ 既に保存済み", `このURLは登録済みです。<br><small>${escapeHtml(normalizedUrl)}</small>`, normalizedUrl, userId),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // メタ情報取得
    const platform = detectPlatform(normalizedUrl);
    const contentType = detectContentType(normalizedUrl);
    const metadata = await fetchVideoMetadata(normalizedUrl);
    const finalContentType = metadata.contentType || contentType;

    // 保存
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: userId,
        url: normalizedUrl,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        platform,
        content_type: finalContentType,
        duration: metadata.duration,
        site_name: metadata.siteName,
        video_url: metadata.videoUrl,
        video_source: metadata.videoSource,
        tags: [],
        memo: "",
      })
      .select()
      .single();

    if (error) {
      // UNIQUE制約
      if (error.code === "23505") {
        return new NextResponse(
          generateHTML("⚠️ 既に保存済み", `このURLは登録済みです。`, normalizedUrl, userId),
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      return new NextResponse(
        generateHTML("❌ 保存失敗", `DB error: ${escapeHtml(error.message)}`, normalizedUrl, userId),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const title = data?.title || normalizedUrl;
    return new NextResponse(
      generateHTML("✅ 保存しました！", `<strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(normalizedUrl)}</small>`, normalizedUrl, userId),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(
      generateHTML("❌ エラー", `サーバーエラー: ${escapeHtml(msg)}`, url, userId),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

/** 結果表示用のHTMLページ（デバッグ情報付き） */
function generateHTML(title: string, message: string, url?: string | null, userId?: string | null, rawRequestUrl?: string): string {
  const debugInfo = url || userId || rawRequestUrl
    ? `<p style="margin-top:1rem;font-size:10px;color:#94a3b8;word-break:break-all">user: ${escapeHtml(userId || "none")}<br>url: ${escapeHtml(url || "none")}${rawRequestUrl ? `<br><br>raw: ${escapeHtml(rawRequestUrl)}` : ""}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} - あの動画どこ？</title>
  <style>
    body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}
    .card{background:#fff;border-radius:16px;padding:2rem;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:400px;width:90%}
    h1{font-size:1.5rem;margin:0 0 .5rem}
    p{color:#64748b;font-size:.875rem;line-height:1.6;word-break:break-all}
    .close{margin-top:1rem;display:inline-block;padding:.5rem 1.5rem;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-size:.875rem}
    .close:hover{background:#4f46e5}
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>${debugInfo}
    <a href="/" class="close">あの動画どこ？を開く</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * テキストから最初のHTTP(S) URLを抽出する
 * YouTubeアプリが「動画タイトル\nhttps://youtu.be/xxx」形式で共有するケースに対応
 */
function extractFirstUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s\r\n"'<>]+/i);
  return match ? match[0] : text;
}

/**
 * &url= 以降の文字列をすべてURLとして抽出する
 * iOSショートカットがURLエンコードせずに結合するケースに対応
 *
 * 例: .../quick?user_id=xxx&url=https://www.youtube.com/watch?v=abc&feature=shared
 *   → "https://www.youtube.com/watch?v=abc&feature=shared"
 */
function extractUrlParam(fullUrl: string): string | null {
  const marker = "&url=";
  const idx = fullUrl.indexOf(marker);
  if (idx === -1) {
    // ?url= で始まるケース
    const marker2 = "?url=";
    const idx2 = fullUrl.indexOf(marker2);
    if (idx2 === -1) return null;
    const afterUrl = fullUrl.substring(idx2 + marker2.length);
    // user_id が後にある場合は除去
    const userIdIdx = afterUrl.indexOf("&user_id=");
    return userIdIdx === -1 ? afterUrl : afterUrl.substring(0, userIdIdx);
  }
  return fullUrl.substring(idx + marker.length);
}
