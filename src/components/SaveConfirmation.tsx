"use client";

import { useState } from "react";
import type { VideoMetadata } from "@/lib/metadata-fetcher";
import { getPlatformIcon, getPlatformLabel } from "@/lib/platform-detector";

interface SaveConfirmationProps {
  url: string;
  metadata: VideoMetadata | null;
  isLoading: boolean;
  onSave: (tags: string[], memo: string) => Promise<void>;
  existingTags?: string[];
}

/**
 * 共有メニューから飛んだ時の保存確認画面
 */
export default function SaveConfirmation({
  url,
  metadata,
  isLoading,
  onSave,
  existingTags = [],
}: SaveConfirmationProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [memo, setMemo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setNewTag("");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedTags, memo);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl">✅</p>
        <p className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          保存しました！
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          トップページで確認できます
        </p>
        <a href="/" className="btn-primary mt-6 inline-block">
          一覧を見る
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        ✅ 保存する動画
      </h2>

      {/* プレビューカード */}
      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ) : (
          <>
            {metadata?.thumbnail && (
              <img
                src={metadata.thumbnail}
                alt={metadata.title || ""}
                className="mb-3 aspect-video w-full rounded-xl object-cover"
              />
            )}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {metadata?.title || url}
            </h3>
            {metadata && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {getPlatformIcon(metadata.platform)}{" "}
                {getPlatformLabel(metadata.platform)}
                {metadata.duration && ` │ ⏱ ${metadata.duration}`}
              </p>
            )}
          </>
        )}
      </div>

      {/* タグ選択 */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          タグを選択（任意）
        </p>
        <div className="flex flex-wrap gap-2">
          {existingTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {tag}
            </button>
          ))}
          {/* 新規タグ追加 */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewTag())}
              placeholder="＋ 新規タグ"
              className="w-24 rounded-full border border-gray-300 px-3 py-1 text-sm outline-none focus:border-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* メモ */}
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          メモ（任意）
        </p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="一言メモ..."
          rows={2}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={isSaving || isLoading}
        className="btn-primary w-full text-lg disabled:opacity-50"
      >
        {isSaving ? "保存中..." : "💾 保存する"}
      </button>
    </div>
  );
}
