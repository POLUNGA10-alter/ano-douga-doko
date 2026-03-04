"use client";

import { useState, useEffect, useCallback } from "react";
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

  const [copiedUrl, setCopiedUrl] = useState(false);

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        🔧 便利ツール
      </h1>

      {/* Android: PWA Share Target */}
      <section className="card mb-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          🤖 Android：共有メニューから保存
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          ホーム画面に追加すると、他アプリの「共有」ボタンから直接保存できます。
        </p>
        <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
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
          🍎 iPhone / iPad：ショートカットで保存
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          iOSの「ショートカット」アプリを使えば、共有メニューからワンタップで保存できます。
        </p>

        {/* あなたの保存用URL */}
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20">
          <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            📋 あなた専用の保存URL（ショートカットに貼り付けて使います）
          </p>
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

        {/* 設定手順 */}
        <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            設定手順（1回だけ）
          </p>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              1
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                「ショートカット」アプリを開く
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                iPhoneに最初から入っています。見つからない場合はApp Storeで「ショートカット」を検索
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              2
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                右上の「＋」で新規作成 → 名前を入力
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                名前は「🎬 動画どこに保存」がおすすめ（共有メニューに表示される名前です）
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              3
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                共有シートに表示を設定
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                下部の <strong>ℹ️ ボタン</strong>をタップ →「<strong>共有シートに表示</strong>」をON → 受け入れるタイプを「<strong>URL</strong>」のみにする
              </p>
            </div>
          </div>

          {/* ビジュアルガイド: 完成形 */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              📋 以下の順番で4つのアクションを追加してください：
            </p>
            <div className="space-y-2">
              {/* アクション1 */}
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-blue-400">共有シート</span> から <span className="text-blue-400">URL</span> を受け取る
              </div>
              {/* アクション2 */}
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-yellow-400">テキスト</span>
                <div className="mt-1 rounded bg-gray-700 px-2 py-1 text-[10px] text-gray-300 break-all">
                  {quickSaveUrl || "https://ano-douga-doko.vercel.app/api/bookmark/quick?user_id=...&url="}
                </div>
              </div>
              {/* アクション3 */}
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-yellow-400">テキスト</span> を <span className="text-orange-400">カスタム（区切り文字なし）</span>
                <br />
                <span className="text-blue-400">ショートカットの入力</span> で結合
              </div>
              {/* アクション4 */}
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-blue-400">結合済みテキスト</span> の <span className="text-green-400">URLの内容を取得</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              4
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                アクション①：「テキスト」を追加
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                下の検索バーで「テキスト」と検索 → 追加 → 上の保存URLをコピーして貼り付け
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              5
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                アクション②：「テキストを結合」を追加
              </p>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                <p>・1番目: <strong>テキスト</strong>（上で作ったもの）</p>
                <p>・2番目: <strong>ショートカットの入力</strong>（共有されたURL）</p>
                <p>・区切り文字: <strong>カスタム → 空欄のまま</strong>（何も入れない）</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              6
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                アクション③：「URLの内容を取得」を追加
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                検索バーで「URL」と検索 →「URLの内容を取得」を追加 → 入力は自動で「<strong>結合済みテキスト</strong>」になります
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-900/50 dark:text-green-400">
              ✓
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                完了！YouTube等で「共有」→「🎬 動画どこに保存」で保存
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                共有メニューに表示されない場合は、共有メニュー一番下の「アクションを編集」からONにしてください
              </p>
            </div>
          </div>
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
