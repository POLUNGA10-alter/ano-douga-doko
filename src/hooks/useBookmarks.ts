"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Bookmark } from "@/types/bookmark";
import type { Platform } from "@/lib/platform-detector";
import { useUserId } from "./useUserId";

/** 並び替えの種類 */
export type SortOrder = "newest" | "oldest" | "platform" | "custom";

/**
 * ブックマークのCRUD操作を管理するhook
 */
export function useBookmarks() {
  const { userId } = useUserId();
  const [allBookmarks, setAllBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  /** ブックマーク一覧を取得（常にフィルタなしで全件取得） */
  const fetchBookmarks = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ user_id: userId });
      const res = await fetch(`/api/bookmark?${params}`);
      const data = await res.json();
      setAllBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  /** クライアント側でフィルタリング → 検索 → 並び替え */
  const bookmarks = useMemo(() => {
    let filtered = allBookmarks;

    // タグフィルタ
    if (selectedTag) {
      filtered = filtered.filter((b) => b.tags.includes(selectedTag));
    }

    // プラットフォームフィルタ
    if (selectedPlatform) {
      filtered = filtered.filter((b) => b.platform === selectedPlatform);
    }

    // キーワード検索（タイトル・URL・メモをOR検索）
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          b.url.toLowerCase().includes(q) ||
          (b.memo && b.memo.toLowerCase().includes(q))
      );
    }

    // 並び替え
    const sorted = [...filtered];
    switch (sortOrder) {
      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "platform":
        sorted.sort((a, b) => a.platform.localeCompare(b.platform));
        break;
      case "custom":
        sorted.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return sorted;
  }, [allBookmarks, selectedTag, selectedPlatform, searchQuery, sortOrder]);

  /** ブックマークを追加（メタ情報取得結果も返す） */
  const addBookmark = async (
    url: string,
    tags: string[] = [],
    memo: string = ""
  ): Promise<{ fetchSuccess: boolean; fetchError: string | null; duplicate?: boolean }> => {
    if (!userId) return { fetchSuccess: false, fetchError: "User ID not found" };

    const res = await fetch("/api/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, user_id: userId, tags, memo }),
    });

    const data = await res.json();

    // 重複URLの場合
    if (res.status === 409 && data.duplicate) {
      return {
        fetchSuccess: false,
        fetchError: data.error,
        duplicate: true,
      };
    }

    if (!res.ok) {
      throw new Error(data.error || "Failed to save");
    }

    await fetchBookmarks();

    return {
      fetchSuccess: data.meta?.fetchSuccess ?? true,
      fetchError: data.meta?.fetchError ?? null,
    };
  };

  /** ブックマークを編集（タイトル・メモ・タグ） */
  const editBookmark = async (
    id: string,
    updates: { title?: string; memo?: string; tags?: string[] }
  ) => {
    if (!userId) return;

    const res = await fetch("/api/bookmark", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, user_id: userId, ...updates }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update");
    }

    // ローカル状態を更新（再フェッチ不要）
    setAllBookmarks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...data.bookmark } : b
      )
    );
  };

  /** ブックマークを削除 */
  const deleteBookmark = async (id: string) => {
    if (!userId) return;
    const res = await fetch(
      `/api/bookmark?id=${id}&user_id=${userId}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to delete");
    setAllBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  /** ブックマークの並び順を更新（D&D用） */
  const reorderBookmarks = async (orderedIds: string[]) => {
    // 楽観的更新
    setAllBookmarks((prev) => {
      const map = new Map(prev.map((b) => [b.id, b]));
      return orderedIds
        .map((id, i) => {
          const b = map.get(id);
          return b ? { ...b, sort_order: i } : null;
        })
        .filter(Boolean) as typeof prev;
    });

    try {
      const items = orderedIds.map((id, i) => ({ id, sort_order: i }));
      const res = await fetch("/api/bookmark/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, items }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // 失敗時は再取得
      await fetchBookmarks();
    }
  };

  /** 全タグの一覧を抽出（フィルタ前の全データから） */
  const allTags = Array.from(
    new Set(allBookmarks.flatMap((b) => b.tags))
  ).sort();

  /** 保存データに含まれるプラットフォーム一覧（フィルタ前の全データから） */
  const activePlatforms = Array.from(
    new Set(allBookmarks.map((b) => b.platform))
  ) as Platform[];

  /** プラットフォーム別件数（バッジ用） */
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of allBookmarks) {
      counts[b.platform] = (counts[b.platform] || 0) + 1;
    }
    return counts;
  }, [allBookmarks]);

  return {
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
    userId,
    totalCount: allBookmarks.length,
  };
}
