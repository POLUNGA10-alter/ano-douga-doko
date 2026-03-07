"use client";

import { useState, useCallback } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkList from "@/components/BookmarkList";
import TagFilter from "@/components/TagFilter";
import PlatformFilter from "@/components/PlatformFilter";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import SearchBar from "@/components/SearchBar";
import SortSelector from "@/components/SortSelector";
import EditBookmarkModal from "@/components/EditBookmarkModal";
import BulkImportModal from "@/components/BulkImportModal";
import ExportModal from "@/components/ExportModal";
import ShareCollectionModal from "@/components/ShareCollectionModal";
import ShareButtons from "@/components/ShareButtons";
import AdBanner from "@/components/AdBanner";
import { APP_CONFIG } from "@/config/app";
import type { Bookmark } from "@/types/bookmark";

/**
 * トップページ（ブックマーク一覧）
 */
export default function Home() {
  const {
    bookmarks,
    isLoading,
    allTags,
    activePlatforms,
    platformCounts,
    selectedTag,
    setSelectedTag,
    selectedPlatform,
    setSelectedPlatform,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    addBookmark,
    editBookmark,
    deleteBookmark,
    reorderBookmarks,
    totalCount,
    userId,
  } = useBookmarks();

  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShareCollection, setShowShareCollection] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedShortcutUrl, setCopiedShortcutUrl] = useState(false);

  const handleCopyId = useCallback(async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = userId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [userId]);

  const shortcutUrl = userId
    ? `${typeof window !== "undefined" ? window.location.origin : APP_CONFIG.url}/api/bookmark/quick?user_id=${userId}&url=`
    : null;

  const handleCopyShortcutUrl = useCallback(async () => {
    if (!shortcutUrl) return;
    try {
      await navigator.clipboard.writeText(shortcutUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shortcutUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedShortcutUrl(true);
    setTimeout(() => setCopiedShortcutUrl(false), 3000);
  }, [shortcutUrl]);

  const handleAddUrl = async (url: string) => {
    return await addBookmark(url);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
  };

  const handleSaveEdit = async (
    id: string,
    updates: { title?: string; memo?: string; tags?: string[] }
  ) => {
    await editBookmark(id, updates);
  };

  const handleBulkImportOne = async (url: string): Promise<{ duplicate?: boolean }> => {
    const result = await addBookmark(url);
    if (result.duplicate) {
      return { duplicate: true };
    }
    return {};
  };

  return (
    <div className="flex flex-col items-center">
      {/* ヒーローセクション */}
      <section className="w-full bg-gradient-to-b from-primary-50 to-white px-4 py-12 text-center dark:from-primary-900/20 dark:to-gray-950">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            🎬 {APP_CONFIG.name}
          </h1>
          <p className="mb-6 text-base text-gray-600 dark:text-gray-400">
            {APP_CONFIG.description}
          </p>

          {/* URL入力フォーム */}
          <AddBookmarkForm onSubmit={handleAddUrl} />

          {/* 一括インポートボタン */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowBulkImport(true)}
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              📦 URLをまとめてインポート
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={() => setShowExport(true)}
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              📤 エクスポート
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={() => setShowShareCollection(true)}
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              🔗 まとめシェア
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a
              href="/tools"
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              � 便利な使い方
            </a>
          </div>

          {/* ユーザーID & ショートカットURL */}
          {userId && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <button
                onClick={handleCopyShortcutUrl}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] transition-all ${
                  copiedShortcutUrl
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                }`}
              >
                {copiedShortcutUrl ? "✅ コピーしました！ショートカットに貼り付けてください" : "📱 iOSショートカット用URLをコピー"}
              </button>
              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                title="タップしてIDをコピー"
              >
                🔑 ID: <span className="font-mono">{userId.slice(0, 8)}…</span>
                {copiedId ? <span className="text-green-500">✓</span> : <span>📋</span>}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* フィルタ & 一覧 */}
      <section className="w-full px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* 検索 & 並べ替え */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <SortSelector value={sortOrder} onChange={setSortOrder} />
          </div>

          {/* タグフィルタ */}
          <TagFilter
            tags={allTags}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
          />

          {/* プラットフォームフィルタ */}
          <PlatformFilter
            selectedPlatform={selectedPlatform}
            onSelect={setSelectedPlatform}
            activePlatforms={activePlatforms}
            platformCounts={platformCounts}
          />

          {/* 件数表示 */}
          {!isLoading && totalCount > 0 && (
            <p className="text-xs text-gray-400">
              {bookmarks.length === totalCount
                ? `${totalCount}件`
                : `${bookmarks.length}件 / ${totalCount}件`}
            </p>
          )}

          {/* ブックマーク一覧 */}
          <BookmarkList
            bookmarks={bookmarks}
            onDelete={deleteBookmark}
            onEdit={handleEdit}
            isLoading={isLoading}
            totalCount={totalCount}
            hasSearchQuery={searchQuery.length > 0}
            isDndMode={sortOrder === "custom"}
            onReorder={reorderBookmarks}
          />
        </div>
      </section>

      {/* 編集モーダル */}
      <EditBookmarkModal
        bookmark={editingBookmark}
        allTags={allTags}
        onSave={handleSaveEdit}
        onClose={() => setEditingBookmark(null)}
      />

      {/* 一括インポートモーダル */}
      {showBulkImport && (
        <BulkImportModal
          onImportOne={handleBulkImportOne}
          onClose={() => setShowBulkImport(false)}
        />
      )}

      {/* エクスポートモーダル */}
      {showExport && (
        <ExportModal
          bookmarks={bookmarks}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* シェアコレクションモーダル */}
      {showShareCollection && userId && (
        <ShareCollectionModal
          bookmarks={bookmarks}
          userId={userId}
          onClose={() => setShowShareCollection(false)}
        />
      )}

      {/* 広告 */}
      <AdBanner />

      {/* シェアボタン */}
      <section className="w-full px-4 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            便利だと思ったらシェアしてください
          </p>
          <ShareButtons />
        </div>
      </section>
    </div>
  );
}
