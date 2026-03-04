"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const USER_ID_KEY = "ano-douga-doko-user-id";

/**
 * 匿名ユーザーIDを管理するhook
 * localStorageに保存し、端末ごとに固定
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(USER_ID_KEY, id);
    }
    setUserId(id);
  }, []);

  return userId;
}
