"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BookmarkCard from "./BookmarkCard";
import type { Bookmark } from "@/types/bookmark";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete?: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
  isLoading?: boolean;
  totalCount?: number;
  hasSearchQuery?: boolean;
  /** カスタム並び替えモード */
  isDndMode?: boolean;
  /** D&D並び替え完了時のコールバック */
  onReorder?: (orderedIds: string[]) => void;
}

/** ドラッグ可能なBookmarkCardラッパー */
function SortableBookmarkCard({
  bookmark,
  onDelete,
  onEdit,
}: {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* ドラッグハンドル */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-2 z-10 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-white/90 text-gray-400 shadow-sm backdrop-blur-sm transition-colors hover:bg-indigo-50 hover:text-indigo-500 active:cursor-grabbing dark:bg-gray-800/90 dark:hover:bg-indigo-900/50"
        title="ドラッグして並び替え"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>
      <BookmarkCard
        bookmark={bookmark}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}

/**
 * ブックマーク一覧（グリッド表示 + D&D対応）
 */
export default function BookmarkList({
  bookmarks,
  onDelete,
  onEdit,
  isLoading,
  totalCount = 0,
  hasSearchQuery = false,
  isDndMode = false,
  onReorder,
}: BookmarkListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(bookmarks, oldIndex, newIndex);
      onReorder(reordered.map((b) => b.id));
    },
    [bookmarks, onReorder]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse space-y-3">
            <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    if (totalCount > 0) {
      return (
        <div className="py-16 text-center">
          <p className="text-5xl">🔍</p>
          <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
            {hasSearchQuery
              ? "検索結果が見つかりませんでした"
              : "条件に一致するブックマークがありません"}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            {hasSearchQuery
              ? "キーワードを変えて検索してみてください"
              : "フィルタ条件を変更してみてください"}
          </p>
        </div>
      );
    }

    return (
      <div className="py-16 text-center">
        <p className="text-5xl">📭</p>
        <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
          まだ動画が保存されていません
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          URLを追加するか、他のアプリの共有メニューから保存しましょう
        </p>
      </div>
    );
  }

  // DnDモード
  if (isDndMode && onReorder) {
    return (
      <div>
        <p className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
          <span>↕️</span> ドラッグ＆ドロップで並び替えできます（左上のハンドルを掴んでください）
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={bookmarks.map((b) => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bookmarks.map((bookmark) => (
                <SortableBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  // 通常モード
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
