"use client";

import { useState, useEffect, useRef } from "react";
import type { Bookmark } from "@/types/bookmark";

interface EditBookmarkModalProps {
  bookmark: Bookmark | null;
  allTags: string[];
  onSave: (id: string, updates: { title?: string; memo?: string; tags?: string[] }) => Promise<void>;
  onClose: () => void;
}

export default function EditBookmarkModal({
  bookmark,
  allTags,
  onSave,
  onClose,
}: EditBookmarkModalProps) {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // モーダルが開いたら値をセット
  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || "");
      setMemo(bookmark.memo || "");
      setTags([...bookmark.tags]);
      setError(null);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [bookmark]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!bookmark) return null;

  const handleAddTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSuggestTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(bookmark.id, { title: title || undefined, memo, tags });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const suggestedTags = allTags.filter((t) => !tags.includes(t));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">ブックマーク編集</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* URL（読み取り専用） */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
            <p className="text-xs text-gray-400 truncate">{bookmark.url}</p>
          </div>

          {/* タイトル */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">タイトル</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タイトルを入力（空欄で自動取得値を使用）"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* メモ */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモを入力..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 resize-none
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* タグ */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">タグ</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900"
                    aria-label={`${tag}を削除`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="タグを追加..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg font-medium
                           hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                追加
              </button>
            </div>
            {/* 既存タグの候補 */}
            {suggestedTags.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">既存のタグ：</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSuggestTag(tag)}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full
                                 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* エラー */}
          {error && (
            <p className="text-xs text-red-500 mb-3">{error}</p>
          )}

          {/* ボタン */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium
                         hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 px-4 bg-indigo-500 text-white rounded-lg text-sm font-medium
                         hover:bg-indigo-600 disabled:opacity-60 transition-colors"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
