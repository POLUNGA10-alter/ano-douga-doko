"use client";

import type { Platform } from "@/lib/platform-detector";
import { getPlatformLabel, getPlatformIcon } from "@/lib/platform-detector";

/** よく使われるプラットフォームを先頭に、残りは折りたたみ表示 */
const PRIMARY_PLATFORMS: Platform[] = [
  "youtube",
  "tiktok",
  "instagram",
  "x",
  "niconico",
];

const MORE_PLATFORMS: Platform[] = [
  "vimeo",
  "twitch",
  "dailymotion",
  "bilibili",
  "spotify",
  "soundcloud",
];

interface PlatformFilterProps {
  selectedPlatform: Platform | null;
  onSelect: (platform: Platform | null) => void;
  /** 保存されたブックマークに含まれるプラットフォーム（存在するもののみ表示） */
  activePlatforms?: Platform[];
  /** プラットフォーム別件数（バッジ表示用） */
  platformCounts?: Record<string, number>;
}

/**
 * プラットフォーム別フィルタUI
 * activePlatformsが渡された場合、実際に保存されているプラットフォームのみ表示
 */
export default function PlatformFilter({
  selectedPlatform,
  onSelect,
  activePlatforms,
  platformCounts,
}: PlatformFilterProps) {
  // 表示するプラットフォームを決定
  const platforms = activePlatforms
    ? // 保存データがある場合：既知プラットフォーム順 → 残り
      [...PRIMARY_PLATFORMS, ...MORE_PLATFORMS].filter((p) =>
        activePlatforms.includes(p)
      )
    : PRIMARY_PLATFORMS;

  // 「その他」カテゴリが存在する場合
  const hasOther = activePlatforms?.includes("other");

  if (platforms.length === 0 && !hasOther) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* 全部ボタン */}
      <button
        onClick={() => onSelect(null)}
        className={`touch-target shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          selectedPlatform === null
            ? "bg-primary-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        全部{platformCounts && (
          <span className="ml-1 opacity-70">
            ({Object.values(platformCounts).reduce((a, b) => a + b, 0)})
          </span>
        )}
      </button>
      {platforms.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(selectedPlatform === p ? null : p)}
          className={`touch-target shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedPlatform === p
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          {getPlatformIcon(p)} {getPlatformLabel(p)}
          {platformCounts && platformCounts[p] != null && (
            <span className="ml-1 opacity-70">({platformCounts[p]})</span>
          )}
        </button>
      ))}
      {hasOther && (
        <button
          onClick={() => onSelect(selectedPlatform === "other" ? null : "other")}
          className={`touch-target shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedPlatform === "other"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          🔗 その他
          {platformCounts && platformCounts["other"] != null && (
            <span className="ml-1 opacity-70">({platformCounts["other"]})</span>
          )}
        </button>
      )}
    </div>
  );
}
