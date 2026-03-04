"use client";

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
}

/**
 * タグフィルタUI（横スクロール）
 */
export default function TagFilter({
  tags,
  selectedTag,
  onSelect,
}: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* 全部ボタン */}
      <button
        onClick={() => onSelect(null)}
        className={`touch-target shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          selectedTag === null
            ? "bg-primary-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        全部
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`touch-target shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedTag === tag
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          🏷 {tag}
        </button>
      ))}
    </div>
  );
}
