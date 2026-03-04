"use client";

import { useState, useEffect, useMemo } from "react";
import type { Bookmark } from "@/types/bookmark";
import { getPlatformIcon } from "@/lib/platform-detector";
import ShareButtons from "./ShareButtons";

interface ShareCollectionModalProps {
  bookmarks: Bookmark[];
  userId: string;
  onClose: () => void;
}

/**
 * ブックマークを選択してシェアURLを生成するモーダル
 */
export default function ShareCollectionModal({
  bookmarks,
  userId,
  onClose,
}: ShareCollectionModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // 全タグを抽出
  const allTags = useMemo(() => {
    return Array.from(new Set(bookmarks.flatMap((b) => b.tags))).sort();
  }, [bookmarks]);

  // タグフィルタ適用後のブックマーク
  const displayedBookmarks = useMemo(() => {
    if (!filterTag) return bookmarks;
    return bookmarks.filter((b) => b.tags.includes(filterTag));
  }, [bookmarks, filterTag]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const toggleAll = () => {
    const displayedIds = displayedBookmarks.map((b) => b.id);
    const allDisplayedSelected = displayedIds.every((id) => selected.has(id));
    const next = new Set(selected);
    if (allDisplayedSelected) {
      displayedIds.forEach((id) => next.delete(id));
    } else {
      displayedIds.forEach((id) => {
        if (next.size < 50) next.add(id);
      });
    }
    setSelected(next);
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 50) return; // 最大50件
      next.add(id);
    }
    setSelected(next);
  };

  const handleGenerate = async () => {
    if (selected.size === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/share-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          bookmark_ids: Array.from(selected),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成に失敗しました");
        return;
      }

      setShareUrl(data.shareUrl);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900 flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            🔗 ブックマークをシェア
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {shareUrl ? (
          /* シェアURL生成済み */
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ✅ {selected.size}件のブックマークのシェアURLが生成されました！
            </p>

            {/* URL表示 + コピー */}
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 overflow-x-auto rounded bg-gray-100 p-2 dark:bg-gray-800">
                <code className="text-[10px] text-gray-600 dark:text-gray-400 break-all">
                  {shareUrl}
                </code>
              </div>
              <button
                onClick={handleCopy}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                {copied ? "✓ コピーしました！" : "📋 URLをコピー"}
              </button>
            </div>

            {/* SNSシェアボタン */}
            <div className="text-center">
              <p className="mb-2 text-xs text-gray-400">SNSでシェア</p>
              <ShareButtons
                url={shareUrl}
                text={`おすすめ動画${selected.size}選！ #あの動画どこ`}
              />
            </div>
          </div>
        ) : (
          /* 選択画面 */
          <>
            {/* タグフィルタ */}
            {allTags.length > 0 && (
              <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 shrink-0">タグ:</span>
                  <button
                    onClick={() => setFilterTag(null)}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      filterTag === null
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    すべて
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        filterTag === tag
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  {displayedBookmarks.every((b) => selected.has(b.id)) && displayedBookmarks.length > 0
                    ? filterTag ? `「${filterTag}」をすべて解除` : "すべて解除"
                    : filterTag ? `「${filterTag}」をすべて選択` : "すべて選択"}
                </button>
                <span className="text-xs text-gray-400">
                  {selected.size} / {bookmarks.length} 件選択
                  {filterTag && ` (表示中${displayedBookmarks.length}件)`}
                  {selected.size >= 50 && " (上限)"}
                </span>
              </div>
            </div>

            {/* ブックマーク一覧 */}
            <div className="flex-1 overflow-y-auto p-2">
              {displayedBookmarks.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  {filterTag ? `「${filterTag}」タグのブックマークがありません` : "シェアできるブックマークがありません"}
                </p>
              ) : (
                <div className="space-y-1">
                  {displayedBookmarks.map((b) => (
                    <label
                      key={b.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${
                        selected.has(b.id)
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(b.id)}
                        onChange={() => toggle(b.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {b.thumbnail ? (
                        <img
                          src={b.thumbnail}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-lg dark:bg-gray-800">
                          {getPlatformIcon(b.platform)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">
                          {b.title || b.url}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {getPlatformIcon(b.platform)} {b.platform}
                          {b.tags.length > 0 && ` · ${b.tags.join(", ")}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* エラー */}
            {error && (
              <p className="px-4 text-xs text-red-500">{error}</p>
            )}

            {/* 生成ボタン */}
            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <button
                onClick={handleGenerate}
                disabled={selected.size === 0 || isGenerating}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating
                  ? "⏳ 生成中..."
                  : `🔗 ${selected.size}件のシェアURLを生成`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
