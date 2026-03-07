"use client";

import { useState, useEffect, useCallback } from "react";
import { APP_CONFIG } from "@/config/app";
import { useUserId } from "@/hooks/useUserId";

/**
 * ブックマークレット設置ガイドページ
 * /tools
 */
export default function ToolsPage() {
  const { userId, importUserId } = useUserId();
  const [baseUrl, setBaseUrl] = useState(APP_CONFIG.url as string);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [importInput, setImportInput] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  // ブックマークレットのコード
  const bookmarkletCode = `javascript:void(open('${baseUrl}/api/bookmark/quick?url='+encodeURIComponent(location.href)+'&user_id=${userId || "YOUR_USER_ID"}','_blank','width=420,height=320,top=100,left=100'))`;

  // iOS ショートカット用の保存URL
  const quickSaveUrl = userId
    ? `${baseUrl}/api/bookmark/quick?user_id=${userId}&url=`
    : null;

  const handleCopyUrl = useCallback(async () => {
    if (!quickSaveUrl) return;
    try {
      await navigator.clipboard.writeText(quickSaveUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = quickSaveUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }, [quickSaveUrl]);

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

  const handleImportId = useCallback(() => {
    if (!importInput.trim()) return;
    const ok = importUserId(importInput);
    if (ok) {
      setImportStatus("success");
      setImportInput("");
    } else {
      setImportStatus("error");
    }
    setTimeout(() => setImportStatus("idle"), 3000);
  }, [importInput, importUserId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        � 便利な使い方
      </h1>

      {/* Android: PWA Share Target */}
      <section className="card mb-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          🤖 Android
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          ホーム画面に追加すると、他アプリの「共有」から直接保存できます。
        </p>
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Chrome：</strong> メニュー →「ホーム画面に追加」or「アプリをインストール」
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            インストール後、YouTubeやTikTok等で「共有」→「{APP_CONFIG.name}」で保存できます。
          </p>
        </div>
      </section>

      {/* iOS: ショートカットで保存 */}
      <section className="card mb-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          🍎 iPhone / iPad
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          「ショートカット」アプリを使えば、共有メニューからワンタップで保存できます。
          まずは<strong>ホーム画面に追加</strong>してからご利用ください。
        </p>

        {/* 設定手順 */}
        <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            設定手順（1回だけ）
          </p>

          {/* Step 1 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                「ショートカット」アプリで新規作成
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                右上の「＋」→ 名前を「🎬 動画どこに保存」に設定
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                共有シートに表示をON
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                下部の <strong>ℹ️</strong> →「<strong>共有シートに表示</strong>」をON → 受け入れ：「<strong>テキスト</strong>」「<strong>URL</strong>」両方にチェック
              </p>
            </div>
          </div>

          {/* Step 3: 保存URL + テキストアクション */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              3
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                アクション①：「テキスト」を追加して保存URLを貼り付け
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                下の保存URLをコピー → 「テキスト」アクションに貼り付け → 末尾の <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">url=</code> の後ろに<strong>「ショートカットの入力」</strong>を挿入
              </p>

              {/* 保存URL（ステップ内に配置） */}
              <div className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 dark:border-indigo-800 dark:bg-indigo-900/20">
                {quickSaveUrl ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400 break-all">
                      {quickSaveUrl}
                    </code>
                    <button
                      onClick={handleCopyUrl}
                      className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                    >
                      {copiedUrl ? "✓ コピー済み" : "コピー"}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⏳ 読み込み中...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              4
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                アクション②：「Web表示を表示」を追加
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                検索で「Web」→「<strong>Web表示を表示</strong>」を追加（入力は自動で「テキスト」に）
              </p>
            </div>
          </div>

          {/* ビジュアルガイド: 完成形 */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-2 text-[10px] font-bold text-gray-500 dark:text-gray-400">
              完成イメージ
            </p>
            <div className="space-y-2">
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-yellow-400">テキスト</span>
                <div className="mt-1 rounded bg-gray-700 px-2 py-1 text-[10px] text-gray-300 break-all">
                  {quickSaveUrl || "https://ano-douga-doko.vercel.app/api/bookmark/quick?user_id=...&url="}<span className="text-blue-400"> ショートカットの入力</span>
                </div>
              </div>
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-yellow-400">テキスト</span> で <span className="text-blue-400">Web表示を表示</span>
              </div>
            </div>
          </div>

          {/* 完了 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-900/50 dark:text-green-400">
              ✓
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                完了！YouTube等で「共有」→「🎬 動画どこに保存」
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                表示されない場合は共有メニュー下の「アクションを編集」からON
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ブックマークレットセクション */}
      <section className="card">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          📌 PC（ブックマークレット）
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          ブックマークバーにボタンを追加すると、<strong>ワンクリック</strong>で保存できます。
        </p>

        {/* ステップガイド */}
        <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ブックマークバーを表示する
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chrome: Ctrl+Shift+B / Edge: Ctrl+Shift+B
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                下のボタンをブックマークバーにドラッグ＆ドロップ
              </p>
            </div>
          </div>

          {/* ドラッグ可能なブックマークレットボタン */}
          <div className="flex items-center justify-center py-3">
            {userId ? (
              <a
                href={bookmarkletCode}
                onClick={(e) => e.preventDefault()}
                className="cursor-grab rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:bg-indigo-500 hover:shadow-xl active:scale-95"
                title="これをブックマークバーにドラッグしてください"
              >
                🎬 動画どこに保存
              </a>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⏳ ユーザーID読み込み中...
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                保存したいページで「🎬 動画どこに保存」をクリック！
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ユーザーID管理（非表示） */}
      {/* 
      <section className="card mb-8 mt-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          🔑 ユーザーID管理
        </h2>
        ...
      </section>
      */}

      <div className="mt-8 text-center">
        <a
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ← トップに戻る
        </a>
      </div>
    </div>
  );
}
