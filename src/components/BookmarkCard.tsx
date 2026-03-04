"use client";

import { useState } from "react";
import {
  getPlatformIcon,
  getPlatformLabel,
  extractDomain,
  isKnownPlatform,
} from "@/lib/platform-detector";
import type { Bookmark } from "@/types/bookmark";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
}

/**
 * サムネイル付きコンテンツカード
 * 動画・音声・記事・不明なURLすべてに対応
 * ページ内動画検出時は「🎬 動画あり」バッジを表示
 */
export default function BookmarkCard({ bookmark, onDelete, onEdit }: BookmarkCardProps) {
  const timeAgo = getTimeAgo(bookmark.created_at);
  const [imgError, setImgError] = useState(false);
  const contentType = bookmark.content_type || "unknown";
  const isVideo = contentType === "video";
  const isAudio = contentType === "audio";

  // ページ内動画が検出されたか（直接動画プラットフォームではなく、ページ内で発見）
  const hasEmbeddedVideo = !!bookmark.video_url;
  const videoSourceLabel = bookmark.video_source
    ? {
        "og:video": "動画あり",
        "html5-video": "動画あり",
        "iframe-embed": "埋め込み動画",
        "direct-file": "動画ファイル",
      }[bookmark.video_source] || null
    : null;

  // 表示用のプラットフォーム名（「その他」の場合はドメイン名）
  const displayPlatform = isKnownPlatform(bookmark.platform)
    ? getPlatformLabel(bookmark.platform)
    : bookmark.site_name || extractDomain(bookmark.url);

  // コンテンツ種別のバッジ
  // ページ内動画を検出した場合は特別バッジ
  const contentBadge = hasEmbeddedVideo && !isKnownPlatform(bookmark.platform)
    ? `🎬 ${videoSourceLabel}`
    : {
        video: null, // 既知動画プラットフォームはバッジ不要
        audio: "🎵 音声",
        article: "📄 ページ",
        unknown: "🔗 リンク",
      }[contentType];

  // サムネが無い場合のフォールバック絵文字
  const fallbackEmoji = {
    video: "🎬",
    audio: "🎵",
    article: "📄",
    unknown: "🔗",
  }[contentType];

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card group relative block transition-shadow hover:shadow-md"
    >
      {/* サムネイル */}
      <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        {bookmark.thumbnail && !imgError ? (
          <img
            src={bookmark.thumbnail}
            alt={bookmark.title || "サムネイル"}
            className={`w-full object-cover transition-transform group-hover:scale-105 ${
              isVideo || isAudio ? "aspect-video" : "aspect-[1.91/1]"
            }`}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`flex items-center justify-center text-4xl text-gray-400 ${
              isVideo || isAudio ? "aspect-video" : "aspect-[2/1]"
            }`}
          >
            {fallbackEmoji}
          </div>
        )}

        {/* 再生時間バッジ（動画・音声のみ） */}
        {bookmark.duration && (isVideo || isAudio) && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {bookmark.duration}
          </span>
        )}

        {/* コンテンツ種別バッジ（動画以外） */}
        {contentBadge && (
          <span className="absolute left-2 top-2 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-300">
            {contentBadge}
          </span>
        )}

        {/* 埋め込み動画再生ボタン（ページ内動画がある場合） */}
        {hasEmbeddedVideo && !isKnownPlatform(bookmark.platform) && (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(bookmark.video_url!, "_blank", "noopener,noreferrer");
            }}
            className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-indigo-600/90 px-2 py-1 text-[10px] font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 cursor-pointer"
            title="埋め込み動画を開く"
          >
            ▶ 動画を見る
          </span>
        )}
      </div>

      {/* 情報 */}
      <div className="space-y-1.5">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
          {bookmark.title || truncateUrl(bookmark.url)}
        </h3>

        {/* メモがある場合 */}
        {bookmark.memo && (
          <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
            💬 {bookmark.memo}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {getPlatformIcon(bookmark.platform)} {displayPlatform}
          </span>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>

        {/* タグ */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {bookmark.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              >
                🏷 {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 編集・削除ボタン（モバイル: 常時表示 / PC: ホバー時表示） */}
      {(onEdit || onDelete) && (
        <div className="absolute right-2 top-2 flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(bookmark);
              }}
              className="rounded-full bg-black/50 p-1.5 text-white hover:bg-indigo-600/80 transition-colors"
              aria-label="編集"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(bookmark.id);
              }}
              className="rounded-full bg-black/50 p-1.5 text-white hover:bg-red-600/80 transition-colors"
              aria-label="削除"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </a>
  );
}

/** 経過時間を日本語で表示 */
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 30) return `${diffDay}日前`;
  return `${Math.floor(diffDay / 30)}ヶ月前`;
}

/** URLを短く表示（タイトル取得失敗時のフォールバック） */
function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.slice(0, 30) + "..." : u.pathname;
    return `${u.hostname}${path}`;
  } catch {
    return url.length > 50 ? url.slice(0, 50) + "..." : url;
  }
}
