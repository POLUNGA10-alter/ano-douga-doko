"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "ano-douga-doko-user-id";

/**
 * 匿名ユーザーIDを管理するhook
 * localStorageに保存し、端末ごとに固定
 *
 * Safari と PWA（ホーム画面に追加）は別々の localStorage を持つため、
 * importUserId で他のコンテキストの ID を取り込む機能を提供する
 */
export function useUserId(): {
  userId: string | null;
  importUserId: (newId: string) => boolean;
} {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(USER_ID_KEY, id);
    }
    setUserId(id);
  }, []);

  /**
   * 他の端末/ブラウザ/PWAから user_id をインポートして上書き保存する
   * @returns true: 成功, false: 無効なID
   */
  const importUserId = useCallback((newId: string): boolean => {
    const trimmed = newId.trim();
    // UUID v4 の簡易バリデーション
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
      return false;
    }
    localStorage.setItem(USER_ID_KEY, trimmed);
    setUserId(trimmed);
    return true;
  }, []);

  return { userId, importUserId };
}
