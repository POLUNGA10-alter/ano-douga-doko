"use client";

import { useState } from "react";

interface BulkImportModalProps {
  onImport: (urls: string[]) => Promise<{ success: number; duplicates: number; errors: number }>;
  onClose: () => void;
}

export default function BulkImportModal({ onImport, onClose }: BulkImportModalProps) {
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  const [result, setResult] = useState<{
    success: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  // テキストからURL抽出
  const extractUrls = (input: string): string[] => {
    const urlRegex = /https?:\/\/[^\s<>"'`,;)}\]]+/g;
    const matches = input.match(urlRegex) || [];
    // 重複を除去
    return [...new Set(matches)];
  };

  const urls = extractUrls(text);

  const handleImport = async () => {
    if (urls.length === 0) return;
    setImporting(true);
    setProgress({ current: 0, total: urls.length, success: 0, duplicates: 0, errors: 0 });
    setResult(null);

    let success = 0;
    let duplicates = 0;
    let errors = 0;

    for (let i = 0; i < urls.length; i++) {
      try {
        const res = await fetch("/api/bookmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: urls[i],
            user_id: localStorage.getItem("ano-douga-user-id") || "",
            tags: [],
            memo: "",
          }),
        });

        if (res.status === 409) {
          duplicates++;
        } else if (!res.ok) {
          errors++;
        } else {
          success++;
        }
      } catch {
        errors++;
      }

      setProgress({
        current: i + 1,
        total: urls.length,
        success,
        duplicates,
        errors,
      });
    }

    setResult({ success, duplicates, errors });
    setImporting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !importing) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              📦 一括インポート
            </h2>
            {!importing && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="閉じる"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {!result ? (
            <>
              {/* 説明 */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                URLを1行1つ、またはまとめて貼り付けてください。
                テキスト内のURLを自動で検出します。
              </p>

              {/* テキストエリア */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`https://www.youtube.com/watch?v=xxxxx\nhttps://www.nicovideo.jp/watch/smxxxxx\nhttps://example.com/article`}
                rows={8}
                disabled={importing}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-none
                           focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50
                           placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />

              {/* URL検出結果 */}
              {text.trim() && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {urls.length > 0
                    ? `🔗 ${urls.length}件のURLを検出しました`
                    : "⚠️ URLが見つかりませんでした"}
                </p>
              )}

              {/* プログレスバー */}
              {progress && importing && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {progress.current} / {progress.total} 処理中...
                    {progress.success > 0 && ` ✅${progress.success}`}
                    {progress.duplicates > 0 && ` ⚠️${progress.duplicates}`}
                    {progress.errors > 0 && ` ❌${progress.errors}`}
                  </p>
                </div>
              )}

              {/* ボタン */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={onClose}
                  disabled={importing}
                  className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium
                             hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || urls.length === 0}
                  className="flex-1 py-2 px-4 bg-indigo-500 text-white rounded-lg text-sm font-medium
                             hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? "インポート中..." : `${urls.length}件をインポート`}
                </button>
              </div>
            </>
          ) : (
            /* 結果表示 */
            <div className="text-center py-4">
              <p className="text-4xl mb-4">🎉</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                インポート完了
              </p>
              <div className="space-y-2 text-sm">
                {result.success > 0 && (
                  <p className="text-green-600 dark:text-green-400">
                    ✅ {result.success}件を保存しました
                  </p>
                )}
                {result.duplicates > 0 && (
                  <p className="text-amber-600 dark:text-amber-400">
                    ⚠️ {result.duplicates}件は既に保存済みでした
                  </p>
                )}
                {result.errors > 0 && (
                  <p className="text-red-600 dark:text-red-400">
                    ❌ {result.errors}件の保存に失敗しました
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="mt-6 py-2 px-8 bg-indigo-500 text-white rounded-lg text-sm font-medium
                           hover:bg-indigo-600 transition-colors"
              >
                閉じる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
