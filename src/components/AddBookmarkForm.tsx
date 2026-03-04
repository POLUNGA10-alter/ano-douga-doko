"use client";

import { useState } from "react";
import { detectPlatform, getPlatformIcon, getPlatformLabel, isKnownPlatform, extractDomain } from "@/lib/platform-detector";

interface AddBookmarkFormProps {
  onSubmit: (url: string) => Promise<{ fetchSuccess: boolean; fetchError: string | null; duplicate?: boolean }>;
}

/**
 * URL手動入力フォーム
 * どんなURLでも保存可能。動画以外のURLも受け付ける。
 */
export default function AddBookmarkForm({ onSubmit }: AddBookmarkFormProps) {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  /** 入力中のURLのプレビュー情報 */
  const previewPlatform = url.trim() ? detectPlatform(url.trim()) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setToast(null);

    const trimmed = url.trim();
    if (!trimmed) return;

    // URLバリデーション
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      setError("正しいURLを入力してください（http:// または https:// で始まるもの）");
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError("http:// または https:// で始まるURLを入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(trimmed);

      // 重複URLの場合
      if (result.duplicate) {
        setToast({
          message: "⚠️ このURLはすでに保存されています",
          type: "warning",
        });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      setUrl("");

      // フィードバック表示
      if (result.fetchSuccess) {
        setToast({ message: "✅ 保存しました！", type: "success" });
      } else {
        setToast({
          message: "✅ URLを保存しました（タイトル・サムネの自動取得ができませんでした）",
          type: "warning",
        });
      }

      // 3秒後にトースト消去
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存に失敗しました";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="URLを貼り付け（動画・記事・なんでもOK）"
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !url.trim()}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                保存中
              </span>
            ) : (
              "＋ 保存"
            )}
          </button>
        </div>

        {/* URL入力中のプレビュー */}
        {previewPlatform && url.trim() && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isKnownPlatform(previewPlatform) ? (
              <>
                {getPlatformIcon(previewPlatform)} {getPlatformLabel(previewPlatform)}
                の動画として保存されます
              </>
            ) : (
              <>🔗 {extractDomain(url.trim())} のリンクとして保存されます</>
            )}
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      {/* 保存結果トースト */}
      {toast && (
        <div
          className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
