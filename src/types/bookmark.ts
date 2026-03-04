import type { Platform, ContentType } from "@/lib/platform-detector";

/**
 * ブックマーク型定義
 */
export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  thumbnail: string | null;
  platform: Platform;
  content_type: ContentType;
  duration: string | null;
  tags: string[];
  memo: string;
  site_name: string | null;
  /** ページ内で検出された動画URL（og:video / <video> / iframe埋め込み） */
  video_url: string | null;
  /** 動画の検出元 */
  video_source: string | null;
  /** カスタム並び順 */
  sort_order: number;
  created_at: string;
}

/**
 * タグ型定義
 */
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
}


