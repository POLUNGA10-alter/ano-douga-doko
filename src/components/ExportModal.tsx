"use client";

import { useState, useEffect } from "react";
import type { Bookmark } from "@/types/bookmark";

interface ExportModalProps {
  bookmarks: Bookmark[];
  onClose: () => void;
}

type ExportFormat = "json" | "csv";

/**
 * ブックマークのエクスポートモーダル
 * JSON / CSV 形式でダウンロード可能
 */
export default function ExportModal({ bookmarks, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [includeFields, setIncludeFields] = useState({
    url: true,
    title: true,
    platform: true,
    tags: true,
    memo: true,
    created_at: true,
    thumbnail: false,
    duration: false,
    content_type: false,
  });
  const [copied, setCopied] = useState(false);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /** 選択されたフィールドのみ含むデータを生成 */
  const getExportData = () => {
    return bookmarks.map((b) => {
      const row: Record<string, string | boolean | string[] | null> = {};
      if (includeFields.url) row.url = b.url;
      if (includeFields.title) row.title = b.title || "";
      if (includeFields.platform) row.platform = b.platform;
      if (includeFields.tags) row.tags = format === "csv" ? (b.tags || []).join("; ") : (b.tags || []);
      if (includeFields.memo) row.memo = b.memo || "";
      if (includeFields.created_at) row.created_at = b.created_at;
      if (includeFields.thumbnail) row.thumbnail = b.thumbnail || "";
      if (includeFields.duration) row.duration = b.duration || "";
      if (includeFields.content_type) row.content_type = b.content_type || "";
      return row;
    });
  };

  /** JSONテキスト生成 */
  const toJSON = (): string => {
    return JSON.stringify(getExportData(), null, 2);
  };

  /** CSV テキスト生成 */
  const toCSV = (): string => {
    const data = getExportData();
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const escapeCSV = (val: unknown): string => {
      const s = String(val ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = [
      headers.map(escapeCSV).join(","),
      ...data.map((row) => headers.map((h) => escapeCSV(row[h])).join(",")),
    ];
    return rows.join("\n");
  };

  /** ファイルダウンロード */
  const handleDownload = () => {
    const content = format === "json" ? toJSON() : toCSV();
    const mime = format === "json" ? "application/json" : "text/csv";
    const ext = format === "json" ? "json" : "csv";
    const filename = `bookmarks_${new Date().toISOString().slice(0, 10)}.${ext}`;

    const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8` }); // BOM付きCSV
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /** クリップボードにコピー */
  const handleCopy = async () => {
    const content = format === "json" ? toJSON() : toCSV();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fieldLabels: Record<string, string> = {
    url: "URL",
    title: "タイトル",
    platform: "プラットフォーム",
    tags: "タグ",
    memo: "メモ",
    created_at: "保存日時",
    thumbnail: "サムネイルURL",
    duration: "再生時間",
    content_type: "コンテンツ種別",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              📤 エクスポート
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 件数 */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {bookmarks.length}件のブックマークをエクスポート
          </p>

          {/* フォーマット選択 */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              フォーマット
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("json")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                  format === "json"
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
              >
                📋 JSON
              </button>
              <button
                onClick={() => setFormat("csv")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                  format === "csv"
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
              >
                📊 CSV
              </button>
            </div>
          </div>

          {/* フィールド選択 */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              含めるフィールド
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(includeFields).map(([key, checked]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setIncludeFields((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                  />
                  {fieldLabels[key] || key}
                </label>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium
                         hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? "✅ コピー済み" : "📋 コピー"}
            </button>
            <button
              onClick={handleDownload}
              disabled={bookmarks.length === 0}
              className="flex-1 py-2 px-4 bg-indigo-500 text-white rounded-lg text-sm font-medium
                         hover:bg-indigo-600 disabled:opacity-60 transition-colors"
            >
              💾 ダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
