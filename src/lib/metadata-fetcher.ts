/**
 * URLからメタ情報（タイトル、サムネイル等）を取得するロジック
 *
 * 取得戦略（優先順位）:
 * 1. oEmbed API（YouTube / TikTok / Vimeo / Dailymotion / Spotify / SoundCloud）
 * 2. OGPタグ scraping（Instagram / X / ニコニコ / その他全て）
 * 3. <title> タグ フォールバック
 * 4. 全て失敗 → URLのみ保存（タイトル・サムネなし）
 *
 * 注意:
 * - Instagram / X はBot対策が厳しくOGP取得に失敗することが多い
 * - その場合でもURLは保存され、後からユーザーがタイトルを編集できる想定
 */

import {
  detectPlatform,
  detectContentType,
  extractDomain,
  isDirectVideoUrl,
  isDirectMediaUrl,
  type Platform,
  type ContentType,
} from "./platform-detector";

export interface VideoMetadata {
  title: string | null;
  thumbnail: string | null;
  platform: Platform;
  contentType: ContentType;
  duration: string | null;
  author: string | null;
  siteName: string | null;
  /**
   * ページ内で検出された動画URL（og:video / <video> / iframe埋め込み）
   * ページ自体が動画プラットフォームの場合はnull
   */
  videoUrl: string | null;
  /** 動画の検出元 */
  videoSource: 'og:video' | 'html5-video' | 'iframe-embed' | 'direct-file' | null;
  /** メタ情報の取得に成功したか */
  fetchSuccess: boolean;
  /** 取得できなかった理由（デバッグ用） */
  fetchError: string | null;
}

/** フェッチのタイムアウト（ms） */
const FETCH_TIMEOUT = 8000;

// --- oEmbed エンドポイント ---
const OEMBED_ENDPOINTS: Partial<Record<Platform, string>> = {
  youtube: "https://www.youtube.com/oembed",
  tiktok: "https://www.tiktok.com/oembed",
  vimeo: "https://vimeo.com/api/oembed.json",
  dailymotion: "https://www.dailymotion.com/services/oembed",
  spotify: "https://open.spotify.com/oembed",
  soundcloud: "https://soundcloud.com/oembed",
};

/**
 * URLからメタ情報を取得するメイン関数
 * どんなURLでも必ず結果を返す（エラーでもnullフィールドで返す）
 */
export async function fetchVideoMetadata(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url);
  const contentType = detectContentType(url);

  const base: VideoMetadata = {
    title: null,
    thumbnail: null,
    platform,
    contentType,
    duration: null,
    author: null,
    siteName: null,
    videoUrl: null,
    videoSource: null,
    fetchSuccess: false,
    fetchError: null,
  };

  // --- 戦略0: 直接動画ファイルURL ---
  if (isDirectVideoUrl(url)) {
    return {
      ...base,
      title: extractFilenameFromUrl(url),
      contentType: 'video',
      videoUrl: url,
      videoSource: 'direct-file',
      siteName: extractDomain(url),
      fetchSuccess: true,
    };
  }

  // --- 戦略1: oEmbed ---
  if (OEMBED_ENDPOINTS[platform]) {
    try {
      const oembed = await fetchOEmbed(url, platform);
      return { ...base, ...oembed, fetchSuccess: true };
    } catch (e) {
      // oEmbed失敗 → OGPにフォールバック
      console.warn(`oEmbed failed for ${platform}, falling back to OGP:`, e);
    }
  }

  // --- 戦略2: OGP + <title> + ページ内動画検出 ---
  try {
    const ogp = await fetchOGPWithFallback(url, platform);

    // ページ内動画が見つかった場合、contentTypeをvideoに昇格
    const finalContentType =
      ogp.videoUrl && ogp.contentType !== 'audio'
        ? 'video' as ContentType
        : ogp.contentType ?? contentType;

    return {
      ...base,
      ...ogp,
      contentType: finalContentType,
      thumbnail: ogp.thumbnail || generateScreenshotThumbnail(url),
      fetchSuccess: ogp.title !== null || ogp.thumbnail !== null,
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Unknown error";
    console.warn(`OGP fetch failed for ${url}:`, errMsg);

    // --- 戦略3: 最低限の情報だけ返す ---
    return {
      ...base,
      siteName: extractDomain(url),
      thumbnail: generateScreenshotThumbnail(url),
      fetchError: errMsg,
    };
  }
}

/**
 * サムネイルが取得できなかった場合にスクリーンショットサービスのURLを生成
 * 外部APIを使ってページのキャプチャ画像を取得する
 */
function generateScreenshotThumbnail(url: string): string {
  // Google PageSpeed Insights のスクリーンショットAPIは制限が多いため
  // microlink.io のスクリーンショット機能を使用（無料枠: 50req/day）
  // フォールバックとして image.thum.io を使用（完全無料）
  return `https://image.thum.io/get/width/640/crop/360/noanimate/${encodeURIComponent(url)}`;
}

/**
 * oEmbed APIからメタ情報を取得
 */
async function fetchOEmbed(
  url: string,
  platform: Platform
): Promise<Partial<VideoMetadata>> {
  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) throw new Error(`No oEmbed endpoint for ${platform}`);

  const oEmbedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;

  const res = await fetchWithTimeout(oEmbedUrl, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`oEmbed HTTP ${res.status}`);

  const data = await res.json();

  return {
    title: data.title || null,
    thumbnail: data.thumbnail_url || null,
    duration: data.duration ? formatDuration(data.duration) : null,
    author: data.author_name || null,
    siteName: data.provider_name || null,
  };
}

/**
 * OGPタグからメタ情報を取得（<title>フォールバック付き）
 *
 * - リダイレクトに追従
 * - Bot対策で403/429が返る場合でもクラッシュしない
 * - <title>タグをフォールバックとして使う
 */
async function fetchOGPWithFallback(
  url: string,
  platform: Platform
): Promise<Partial<VideoMetadata>> {
  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en;q=0.9",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  // HTMLでない場合（PDF, 画像など）
  const contentTypeHeader = res.headers.get("content-type") || "";
  if (!contentTypeHeader.includes("text/html") && !contentTypeHeader.includes("application/xhtml")) {
    return {
      title: extractDomain(url),
      siteName: extractDomain(url),
    };
  }

  const html = await res.text();

  // OGPタグ取得
  const ogTitle = extractMeta(html, "og:title");
  const ogImage = extractMeta(html, "og:image");
  const ogSiteName = extractMeta(html, "og:site_name");
  const ogDescription = extractMeta(html, "og:description");
  const ogType = extractMeta(html, "og:type");

  // OGP 動画タグ取得（og:video / og:video:url / og:video:secure_url）
  const ogVideo =
    extractMeta(html, "og:video:secure_url") ||
    extractMeta(html, "og:video:url") ||
    extractMeta(html, "og:video");

  // Twitter Card（OGPがない場合のフォールバック）
  const twTitle = extractMeta(html, "twitter:title");
  const twImage = extractMeta(html, "twitter:image");
  const twPlayer = extractMeta(html, "twitter:player");

  // <title> タグ（最終フォールバック）
  const htmlTitle = extractHtmlTitle(html);

  // description からのフォールバック
  const metaDescription = extractMetaName(html, "description");

  const title = ogTitle || twTitle || htmlTitle;
  const thumbnail = ogImage || twImage;
  const siteName = ogSiteName || extractDomain(url);

  // ニコニコは特別処理（oEmbed非対応だがHTMLから再生時間取れる場合）
  let duration: string | null = null;
  if (platform === "niconico") {
    duration = extractNiconicoDuration(html);
  }

  // --- ページ内動画の検出（3段階） ---
  let videoUrl: string | null = null;
  let videoSource: VideoMetadata['videoSource'] = null;

  // 1. OGP og:video タグ（最も信頼性が高い）
  if (ogVideo) {
    videoUrl = resolveUrl(ogVideo, url);
    videoSource = 'og:video';
  }

  // 2. HTML5 <video> タグ
  if (!videoUrl) {
    const html5Video = extractHtml5VideoUrl(html, url);
    if (html5Video) {
      videoUrl = html5Video;
      videoSource = 'html5-video';
    }
  }

  // 3. iframe 埋め込み（YouTube / Vimeo / Dailymotion / ニコニコ 等）
  if (!videoUrl) {
    const iframeVideo = extractIframeEmbedUrl(html);
    if (iframeVideo) {
      videoUrl = iframeVideo;
      videoSource = 'iframe-embed';
    }
  }

  // OGタイプが動画系の場合、contentTypeヒントを付与
  const isOgTypeVideo = ogType?.startsWith('video') || false;
  const detectedContentType: ContentType | undefined =
    (videoUrl || isOgTypeVideo) ? 'video' : undefined;

  return {
    title: title ? decodeHtmlEntities(title) : null,
    thumbnail: thumbnail ? resolveUrl(thumbnail, url) : null,
    duration,
    author: null,
    siteName: siteName ? decodeHtmlEntities(siteName) : null,
    videoUrl,
    videoSource,
    contentType: detectedContentType,
  };
}

// =====================
// ユーティリティ
// =====================

/**
 * タイムアウト付きfetch
 */
async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * OGP / Twitter Card のメタタグからcontentを抽出
 * property="..." と name="..." の両方に対応
 */
function extractMeta(html: string, property: string): string | null {
  // property="og:title" content="..."
  const r1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escapeRegex(property)}["'][^>]+content=["']([^"']*?)["']`,
    "i"
  );
  const m1 = html.match(r1);
  if (m1) return m1[1] || null;

  // content="..." property="og:title"（逆順）
  const r2 = new RegExp(
    `<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${escapeRegex(property)}["']`,
    "i"
  );
  const m2 = html.match(r2);
  return m2 ? m2[1] || null : null;
}

/**
 * <meta name="..." content="..."> からcontentを抽出
 */
function extractMetaName(html: string, name: string): string | null {
  return extractMeta(html, name);
}

/**
 * <title>タグのテキストを抽出
 */
function extractHtmlTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() || null : null;
}

/**
 * ニコニコ動画のHTMLから再生時間を抽出
 */
function extractNiconicoDuration(html: string): string | null {
  // data-video-length="123" のようなパターン
  const match = html.match(/data-video-length=["'](\d+)["']/);
  if (match) {
    return formatDuration(parseInt(match[1], 10));
  }
  // itemprop="duration" content="PT1M23S"
  const isoMatch = html.match(
    /itemprop=["']duration["'][^>]*content=["']PT(\d+)M(\d+)S["']/i
  );
  if (isoMatch) {
    const min = parseInt(isoMatch[1], 10);
    const sec = parseInt(isoMatch[2], 10);
    return formatDuration(min * 60 + sec);
  }
  return null;
}

/**
 * 秒数を "M:SS" または "H:MM:SS" 形式に変換
 */
function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * 相対URLを絶対URLに解決
 */
function resolveUrl(target: string, base: string): string {
  if (target.startsWith("http://") || target.startsWith("https://")) {
    return target;
  }
  try {
    return new URL(target, base).href;
  } catch {
    return target;
  }
}

/**
 * HTMLエンティティをデコード
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * 正規表現で使う文字列をエスケープ
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =====================
// ページ内動画検出ロジック
// =====================

/**
 * HTML内の <video> タグから動画URLを抽出
 *
 * 対象:
 *  - <video src="...">
 *  - <video><source src="..."></video>
 *
 * 個人サイト、企業サイト等の自前ホスト動画に有効
 */
function extractHtml5VideoUrl(html: string, baseUrl: string): string | null {
  // 1. <video src="...">
  const videoSrcMatch = html.match(
    /<video[^>]+src=["']([^"']+?)["']/i
  );
  if (videoSrcMatch) {
    return resolveUrl(videoSrcMatch[1], baseUrl);
  }

  // 2. <video ...> 内の <source src="...">
  // <video> ブロック全体を取得してからsource要素を抽出
  const videoBlockMatch = html.match(
    /<video[^>]*>([\s\S]*?)<\/video>/i
  );
  if (videoBlockMatch) {
    const block = videoBlockMatch[1];
    // type="video/mp4" のsourceを優先
    const mp4Source = block.match(
      /<source[^>]+src=["']([^"']+?)["'][^>]*type=["']video\/mp4["']/i
    );
    if (mp4Source) return resolveUrl(mp4Source[1], baseUrl);

    // type逆順
    const mp4Source2 = block.match(
      /<source[^>]+type=["']video\/mp4["'][^>]*src=["']([^"']+?)["']/i
    );
    if (mp4Source2) return resolveUrl(mp4Source2[1], baseUrl);

    // 任意のsource
    const anySource = block.match(
      /<source[^>]+src=["']([^"']+?)["']/i
    );
    if (anySource) return resolveUrl(anySource[1], baseUrl);
  }

  // 3. data-src パターン（遅延読み込み）
  const dataSrcMatch = html.match(
    /<video[^>]+data-src=["']([^"']+?)["']/i
  );
  if (dataSrcMatch) {
    return resolveUrl(dataSrcMatch[1], baseUrl);
  }

  return null;
}

/**
 * HTML内の iframe 埋め込みから動画プラットフォームURLを抽出
 *
 * 対象:
 *  - YouTube embed (youtube.com/embed/VIDEO_ID)
 *  - Vimeo embed (player.vimeo.com/video/ID)
 *  - Dailymotion embed
 *  - ニコニコ embed
 *  - その他の動画iframe
 *
 * 個人ブログに埋め込まれたYouTube動画などを検出
 */
function extractIframeEmbedUrl(html: string): string | null {
  // iframeのsrcを順次チェック
  const iframeRegex = /<iframe[^>]+src=["']([^"']+?)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = iframeRegex.exec(html)) !== null) {
    const src = match[1];

    // YouTube embed → 視聴URL変換
    const youtubeEmbed = src.match(
      /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9_-]+)/i
    );
    if (youtubeEmbed) {
      return `https://www.youtube.com/watch?v=${youtubeEmbed[1]}`;
    }

    // Vimeo embed → 視聴URL変換
    const vimeoEmbed = src.match(/player\.vimeo\.com\/video\/(\d+)/i);
    if (vimeoEmbed) {
      return `https://vimeo.com/${vimeoEmbed[1]}`;
    }

    // Dailymotion embed
    const dailymotionEmbed = src.match(
      /dailymotion\.com\/embed\/video\/([a-zA-Z0-9]+)/i
    );
    if (dailymotionEmbed) {
      return `https://www.dailymotion.com/video/${dailymotionEmbed[1]}`;
    }

    // ニコニコ動画 embed
    const niconicoEmbed = src.match(
      /nicovideo\.jp\/(?:embed|watch)\/([a-z]{2}\d+)/i
    );
    if (niconicoEmbed) {
      return `https://www.nicovideo.jp/watch/${niconicoEmbed[1]}`;
    }

    // bilibili embed
    const bilibiliEmbed = src.match(
      /player\.bilibili\.com\/player\.html\?.*?bvid=([^&"']+)/i
    );
    if (bilibiliEmbed) {
      return `https://www.bilibili.com/video/${bilibiliEmbed[1]}`;
    }

    // Twitch embed
    const twitchEmbed = src.match(
      /player\.twitch\.tv\/\?.*?video=v?(\d+)/i
    );
    if (twitchEmbed) {
      return `https://www.twitch.tv/videos/${twitchEmbed[1]}`;
    }
  }

  return null;
}

/**
 * URLからファイル名を抽出（直接動画ファイルURL用）
 * 例: https://example.com/videos/my-video.mp4 → "my-video.mp4"
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const filename = segments[segments.length - 1];
    if (filename) {
      // URLデコードして返す
      return decodeURIComponent(filename);
    }
  } catch {
    // ignore
  }
  return null;
}
