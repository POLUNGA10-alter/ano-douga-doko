/**
 * URLからプラットフォームを判定するロジック
 */

export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "x"
  | "niconico"
  | "vimeo"
  | "twitch"
  | "dailymotion"
  | "bilibili"
  | "spotify"
  | "soundcloud"
  | "other";

/** コンテンツの種類（動画/音声/記事/不明） */
export type ContentType = "video" | "audio" | "article" | "unknown";

/** 直接リンクで判定可能な動画ファイル拡張子 */
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|ogg|mov|avi|mkv|m4v|flv|wmv|3gp)(\?|#|$)/i;

/** 直接リンクで判定可能な音声ファイル拡張子 */
const AUDIO_EXTENSIONS = /\.(mp3|wav|flac|aac|m4a|wma|opus)(\?|#|$)/i;

interface PlatformRule {
  platform: Platform;
  patterns: RegExp[];
  contentType: ContentType;
}

const PLATFORM_RULES: PlatformRule[] = [
  {
    platform: "youtube",
    patterns: [
      /youtube\.com\/watch/i,
      /youtu\.be\//i,
      /youtube\.com\/shorts\//i,
      /youtube\.com\/live\//i,
      /youtube\.com\/embed\//i,
      /m\.youtube\.com/i,
    ],
    contentType: "video",
  },
  {
    platform: "tiktok",
    patterns: [
      /tiktok\.com\/@[^/]+\/video\//i,
      /tiktok\.com\/t\//i,
      /vm\.tiktok\.com\//i,
    ],
    contentType: "video",
  },
  {
    platform: "instagram",
    patterns: [
      /instagram\.com\/reel\//i,
      /instagram\.com\/p\//i,
      /instagram\.com\/tv\//i,
    ],
    contentType: "video",
  },
  {
    platform: "x",
    patterns: [/x\.com\/[^/]+\/status\//i, /twitter\.com\/[^/]+\/status\//i],
    contentType: "video", // 動画付きポストが主な用途
  },
  {
    platform: "niconico",
    patterns: [/nicovideo\.jp\/watch\//i, /nico\.ms\//i],
    contentType: "video",
  },
  {
    platform: "vimeo",
    patterns: [/vimeo\.com\/\d+/i, /player\.vimeo\.com\//i],
    contentType: "video",
  },
  {
    platform: "twitch",
    patterns: [
      /twitch\.tv\/videos\//i,
      /twitch\.tv\/[^/]+\/clip\//i,
      /clips\.twitch\.tv\//i,
    ],
    contentType: "video",
  },
  {
    platform: "dailymotion",
    patterns: [/dailymotion\.com\/video\//i, /dai\.ly\//i],
    contentType: "video",
  },
  {
    platform: "bilibili",
    patterns: [/bilibili\.com\/video\//i, /b23\.tv\//i],
    contentType: "video",
  },
  {
    platform: "spotify",
    patterns: [/open\.spotify\.com\/(track|episode|album)\//i],
    contentType: "audio",
  },
  {
    platform: "soundcloud",
    patterns: [/soundcloud\.com\/[^/]+\/[^/]+/i],
    contentType: "audio",
  },
];

/**
 * URLからプラットフォームを判定する
 */
export function detectPlatform(url: string): Platform {
  for (const rule of PLATFORM_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(url)) {
        return rule.platform;
      }
    }
  }
  return "other";
}

/**
 * URLからコンテンツ種別を判定する
 *
 * 優先順位:
 * 1. 既知プラットフォームのルール
 * 2. 直接動画ファイルURL (.mp4, .webm 等)
 * 3. 直接音声ファイルURL (.mp3, .wav 等)
 * 4. 不明
 */
export function detectContentType(url: string): ContentType {
  for (const rule of PLATFORM_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(url)) {
        return rule.contentType;
      }
    }
  }

  // 直接メディアファイルURLの判定
  if (isDirectVideoUrl(url)) return "video";
  if (isDirectAudioUrl(url)) return "audio";

  return "unknown";
}

/**
 * URLが直接動画ファイルを指しているかどうか
 * 例: https://example.com/video.mp4
 */
export function isDirectVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return VIDEO_EXTENSIONS.test(pathname);
  } catch {
    return VIDEO_EXTENSIONS.test(url);
  }
}

/**
 * URLが直接音声ファイルを指しているかどうか
 */
export function isDirectAudioUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return AUDIO_EXTENSIONS.test(pathname);
  } catch {
    return AUDIO_EXTENSIONS.test(url);
  }
}

/**
 * URLが直接メディアファイル（動画 or 音声）を指しているか
 */
export function isDirectMediaUrl(url: string): boolean {
  return isDirectVideoUrl(url) || isDirectAudioUrl(url);
}

/**
 * プラットフォーム表示名を取得
 */
export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    x: "X",
    niconico: "ニコニコ",
    vimeo: "Vimeo",
    twitch: "Twitch",
    dailymotion: "Dailymotion",
    bilibili: "bilibili",
    spotify: "Spotify",
    soundcloud: "SoundCloud",
    other: "その他",
  };
  return labels[platform];
}

/**
 * プラットフォームの絵文字アイコンを取得
 */
export function getPlatformIcon(platform: Platform): string {
  const icons: Record<Platform, string> = {
    youtube: "▶️",
    tiktok: "♪",
    instagram: "📷",
    x: "𝕏",
    niconico: "🎬",
    vimeo: "🎥",
    twitch: "🟣",
    dailymotion: "▶️",
    bilibili: "📺",
    spotify: "🎵",
    soundcloud: "🔊",
    other: "🔗",
  };
  return icons[platform];
}

/**
 * URLが既知の動画プラットフォームかどうか
 */
export function isKnownPlatform(platform: Platform): boolean {
  return platform !== "other";
}

/**
 * ドメイン名をURLから抽出（「その他」表示用）
 */
export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "不明なサイト";
  }
}
