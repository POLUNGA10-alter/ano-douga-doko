"use client";

import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/config/app";
import { useUserId } from "@/hooks/useUserId";

/**
 * ブックマークレット設置ガイドページ
 * /tools
 */
export default function ToolsPage() {
  const userId = useUserId();
  const [baseUrl, setBaseUrl] = useState(APP_CONFIG.url as string);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // ブックマークレットのコード
  const bookmarkletCode = `javascript:void(open('${baseUrl}/api/bookmark/quick?url='+encodeURIComponent(location.href)+'&user_id=${userId || "YOUR_USER_ID"}','_blank','width=420,height=320,top=100,left=100'))`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        🔧 便利ツール
      </h1>

      {/* PWA Share Target の説明 */}
      <section className="card mb-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          📱 スマホからの保存（Share Target）
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          このアプリをホーム画面に追加（PWAインストール）すると、
          他のアプリの「共有」ボタンから直接保存できます。
        </p>
        <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>iOS Safari：</strong> 共有ボタン → 「ホーム画面に追加」
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Android Chrome：</strong> メニュー → 「ホーム画面に追加」
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            インストール後、YouTubeやTikTok等で「共有」→「{APP_CONFIG.name}」で保存できます。
          </p>
        </div>
      </section>

      {/* ブックマークレットセクション */}
      <section className="card">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          📌 ブックマークレット（PC向け）
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          ブラウザのブックマークバーにボタンを追加すると、どのWebページからでも
          <strong>ワンクリック</strong>で「{APP_CONFIG.name}」に保存できます。
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                小さなウィンドウが開いて保存結果が表示されます。3秒で自動で閉じます。
              </p>
            </div>
          </div>
        </div>
      </section>

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
