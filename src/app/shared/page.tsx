"use client";

import { Suspense, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPlatformIcon,
  getPlatformLabel,
  extractDomain,
  isKnownPlatform,
  type Platform,
} from "@/lib/platform-detector";
import { APP_CONFIG } from "@/config/app";
import ShareButtons from "@/components/ShareButtons";
import { useUserId } from "@/hooks/useUserId";

interface SharedBookmark {
  u: string;   // url
  t: string;   // title
  th: string;  // thumbnail
  p: string;   // platform
  ct: string;  // content_type
  d: string;   // duration
  tg: string[]; // tags
  s: string;   // site_name
}

function SharedCollectionContent() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("d");
  const { userId } = useUserId();
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: number; duplicates: number; errors: number } | null>(null);

  const bookmarks = useMemo(() => {
    if (!encoded) return null;
    try {
      const binaryStr = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
      const jsonStr = new TextDecoder().decode(bytes);
      return JSON.parse(jsonStr) as SharedBookmark[];
    } catch {
      return null;
    }
  }, [encoded]);

  // 全タグを抽出
  const allTags = useMemo(() => {
    if (!bookmarks) return [];
    return Array.from(new Set(bookmarks.flatMap((b) => b.tg))).sort();
  }, [bookmarks]);

  // タグフィルタ適用
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    if (!selectedTag) return bookmarks;
    return bookmarks.filter((b) => b.tg.includes(selectedTag));
  }, [bookmarks, selectedTag]);

  // 一括保存
  const handleSaveAll = useCallback(async () => {
    if (!userId || !filteredBookmarks.length) return;
    setIsSaving(true);
    setSaveResult(null);

    let success = 0;
    let duplicates = 0;
    let errors = 0;

    for (const b of filteredBookmarks) {
      try {
        const res = await fetch("/api/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: b.u,
            user_id: userId,
            tags: b.tg,
            memo: "",
          }),
        });
        const data = await res.json();
        if (res.status === 409 && data.duplicate) {
          duplicates++;
        } else if (res.ok) {
          success++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    setSaveResult({ success, duplicates, errors });
    setIsSaving(false);
  }, [userId, filteredBookmarks]);

  if (!encoded || !bookmarks) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl">🤔</p>
        <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
          共有データが見つかりません
        </p>
        <a href="/" className="btn-primary mt-6 inline-block">
          {APP_CONFIG.name} を使ってみる
        </a>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🎬 おすすめ動画まとめ
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {bookmarks.length}件のブックマークが共有されました
        </p>
      </div>

      {/* 一括保存ボタン */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
        {saveResult ? (
          <div className="text-center text-sm">
            <p className="font-medium text-gray-900 dark:text-white">
              ✅ 保存完了！
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {saveResult.success > 0 && `${saveResult.success}件保存`}
              {saveResult.duplicates > 0 && ` / ${saveResult.duplicates}件は既に保存済み`}
              {saveResult.errors > 0 && ` / ${saveResult.errors}件エラー`}
            </p>
            <a
              href="/"
              className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              → マイブックマークを見る
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                📥 {selectedTag ? `「${selectedTag}」の` : ""}{filteredBookmarks.length}件を自分のブックマークに保存
              </p>
              <button
                onClick={handleSaveAll}
                disabled={isSaving || !userId}
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "⏳ 保存中..." : `📥 ${filteredBookmarks.length}件すべて保存`}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              💡 保存したブックマークはこのブラウザで <a href="/" className="underline hover:text-indigo-500">あの動画どこ？</a> を開くと確認できます。別の端末・ブラウザからは見られませんのでご注意ください。
            </p>
          </div>
        )}
      </div>

      {/* タグフィルタ */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">タグで絞り込み:</span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedTag === null
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              🏷 {tag}
            </button>
          ))}
        </div>
      )}

      {/* 件数表示 */}
      {selectedTag && (
        <p className="text-xs text-gray-400">
          {filteredBookmarks.length}件 / {bookmarks.length}件
        </p>
      )}

      {/* ブックマーク一覧 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredBookmarks.map((b, i) => {
          const platform = b.p as Platform;
          const isVideo = b.ct === "video";
          const isAudio = b.ct === "audio";
          const displayPlatform = isKnownPlatform(platform)
            ? getPlatformLabel(platform)
            : b.s || extractDomain(b.u);

          const fallbackEmoji = {
            video: "🎬", audio: "🎵", article: "📄", unknown: "🔗",
          }[b.ct] || "🔗";

          return (
            <a
              key={i}
              href={b.u}
              target="_blank"
              rel="noopener noreferrer"
              className="card group relative block transition-shadow hover:shadow-md"
            >
              {/* サムネイル */}
              <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                {b.th && !imgErrors.has(i) ? (
                  <img
                    src={b.th}
                    alt={b.t || "サムネイル"}
                    className={`w-full object-cover transition-transform group-hover:scale-105 ${
                      isVideo || isAudio ? "aspect-video" : "aspect-[1.91/1]"
                    }`}
                    loading="lazy"
                    onError={() => setImgErrors((prev) => new Set(prev).add(i))}
                  />
                ) : (
                  <div className={`flex items-center justify-center text-4xl text-gray-400 ${
                    isVideo || isAudio ? "aspect-video" : "aspect-[2/1]"
                  }`}>
                    {fallbackEmoji}
                  </div>
                )}

                {/* 再生時間 */}
                {b.d && (isVideo || isAudio) && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
                    {b.d}
                  </span>
                )}
              </div>

              {/* 情報 */}
              <div className="space-y-1.5">
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {b.t || b.u}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{getPlatformIcon(platform)} {displayPlatform}</span>
                </div>
                {b.tg.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {b.tg.map((tag) => (
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
            </a>
          );
        })}
      </div>

      {/* CTA + シェアボタン */}
      <div className="space-y-4 rounded-xl bg-gradient-to-b from-primary-50 to-white p-6 text-center dark:from-primary-900/20 dark:to-gray-950">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          自分だけの動画ブックマーク棚を作ろう
        </p>
        <a
          href="/"
          className="btn-primary inline-block"
        >
          🎬 {APP_CONFIG.name} を使ってみる
        </a>
        <div className="pt-2">
          <p className="mb-2 text-xs text-gray-400">このまとめをシェア</p>
          <ShareButtons url={shareUrl} text={`おすすめ動画${bookmarks.length}選！`} />
        </div>
      </div>
    </div>
  );
}

export default function SharedPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Suspense
        fallback={
          <div className="py-16 text-center">
            <p className="text-2xl animate-pulse">読み込み中...</p>
          </div>
        }
      >
        <SharedCollectionContent />
      </Suspense>
    </div>
  );
}
