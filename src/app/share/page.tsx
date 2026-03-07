"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SaveConfirmation from "@/components/SaveConfirmation";
import type { VideoMetadata } from "@/lib/metadata-fetcher";
import { useUserId } from "@/hooks/useUserId";

/**
 * 共有メニューから飛んだ時の保存画面
 * /share?url=...&title=...&text=...
 */
function SharePageContent() {
  const searchParams = useSearchParams();
  const { userId } = useUserId();
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  // URLは共有メニューから url, text のいずれかで渡される
  const sharedUrl =
    searchParams.get("url") || extractUrl(searchParams.get("text") || "") || "";

  useEffect(() => {
    if (!sharedUrl) {
      setIsLoading(false);
      return;
    }

    const fetchMeta = async () => {
      try {
        const res = await fetch(
          `/api/metadata?url=${encodeURIComponent(sharedUrl)}`
        );
        const data = await res.json();
        setMetadata(data);
      } catch {
        // メタ情報なしでも保存は可能
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeta();
  }, [sharedUrl]);

  // 既存タグ一覧を取得
  useEffect(() => {
    if (!userId) return;
    const fetchTags = async () => {
      try {
        const res = await fetch(`/api/bookmark?user_id=${userId}`);
        const data = await res.json();
        const tags = Array.from(
          new Set((data.bookmarks || []).flatMap((b: { tags: string[] }) => b.tags))
        ).sort() as string[];
        setExistingTags(tags);
      } catch {
        // タグ取得失敗でも保存は可能
      }
    };
    fetchTags();
  }, [userId]);

  const handleSave = async (tags: string[], memo: string) => {
    if (!userId || !sharedUrl) return;

    const res = await fetch("/api/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sharedUrl,
        user_id: userId,
        tags,
        memo,
      }),
    });

    if (!res.ok) throw new Error("Failed to save");
  };

  if (!sharedUrl) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl">🤔</p>
        <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-400">
          URLが指定されていません
        </p>
        <a href="/" className="btn-primary mt-6 inline-block">
          トップへ
        </a>
      </div>
    );
  }

  return (
    <SaveConfirmation
      url={sharedUrl}
      metadata={metadata}
      isLoading={isLoading}
      onSave={handleSave}
      existingTags={existingTags}
    />
  );
}

export default function SharePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Suspense
        fallback={
          <div className="py-16 text-center">
            <p className="text-2xl animate-pulse">読み込み中...</p>
          </div>
        }
      >
        <SharePageContent />
      </Suspense>
    </div>
  );
}

/** テキスト内からURLを抽出するヘルパー */
function extractUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s]+/;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}
