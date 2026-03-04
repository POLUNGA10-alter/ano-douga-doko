"use client";

import type { SortOrder } from "@/hooks/useBookmarks";

interface SortSelectorProps {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
}

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "platform", label: "サービス別" },
  { value: "custom", label: "カスタム" },
];

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <svg
        className="w-4 h-4 text-gray-400 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
        />
      </svg>
      <div className="flex gap-1">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors
              ${
                value === opt.value
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
