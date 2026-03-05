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

        {/* Safari ↔ PWA 警告 */}
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-xs font-bold text-red-700 dark:text-red-400">
            🚨 Safari と PWA（ホーム画面アプリ）では保存先が異なります！
          </p>
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
            iOSでは Safari と ホーム画面に追加したアプリ（PWA）で<strong>別々のユーザーID</strong>が生成されます。
            ショートカットを設定するときは、<strong>普段ブックマークを確認するアプリ</strong>（PWA or Safari）で
            このページを開いて URL をコピーしてください。
          </p>
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
            もし既にショートカットを設定済みで保存できない場合は、下の「🔑 ユーザーID管理」から
            IDを同期してください。
          </p>
        </div>

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
          <div className="mt-2 rounded-md bg-amber-50 p-2 dark:bg-amber-900/20">
            <p className="text-[10px] text-amber-700 dark:text-amber-400">
              ⚠️ <strong>重要：</strong>このURLは<strong>今このページを開いているブラウザ</strong>に紐づいています。
              保存した動画を確認するには、<strong>同じブラウザ</strong>（Safari /  Chrome）で
              <a href="/" className="underline">トップページ</a>を開いてください。
              PWAアプリとSafariでは別の保存先になる場合があります。
            </p>
          </div>
        </div>

        {/* 設定手順 */}
        <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            設定手順（1回だけ・2アクションで完了！）
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
                共有シートの設定
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                下部の <strong>ℹ️ ボタン</strong>をタップ →「<strong>共有シートに表示</strong>」をON → 受け入れるタイプを「<strong>テキスト</strong>」と「<strong>URL</strong>」の両方にチェック
              </p>
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
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                <p>・下の検索バーで「テキスト」と検索 → 追加</p>
                <p>・上の<strong>保存URLをコピー</strong>して貼り付け</p>
                <p>・末尾の <code className="rounded bg-gray-200 px-1 dark:bg-gray-700">url=</code> の後ろにカーソルを置き、<strong>キーボード上に表示される「ショートカットの入力」をタップ</strong>して挿入</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              5
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                アクション②：「Web表示を表示」を追加
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                検索バーで「Web」と検索 →「<strong>Web表示を表示</strong>」を追加 → 入力は自動で「<strong>テキスト</strong>」になります
              </p>
            </div>
          </div>

          {/* ビジュアルガイド: 完成形 */}
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
            <p className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              📋 完成形（この2つのアクションだけでOK）：
            </p>
            <div className="space-y-2">
              {/* アクション1 */}
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-yellow-400">テキスト</span>
                <div className="mt-1 rounded bg-gray-700 px-2 py-1 text-[10px] text-gray-300 break-all">
                  {quickSaveUrl || "https://ano-douga-doko.vercel.app/api/bookmark/quick?user_id=...&url="}<span className="text-blue-400"> ショートカットの入力</span>
                </div>
              </div>
              {/* アクション2 */}
              <div className="rounded-md bg-gray-800 px-3 py-2 text-xs text-white">
                <span className="text-yellow-400">テキスト</span> で <span className="text-blue-400">Web表示を表示</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
              ※「共有シートから テキスト、URL を受け取る」は自動で追加されます
            </p>
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

      {/* ユーザーID管理 */}
      <section className="card mb-8 mt-8">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
          🔑 ユーザーID管理
        </h2>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Safari ↔ PWA 間でブックマークを共有するには、同じユーザーIDを使う必要があります。
        </p>

        {/* 現在のID */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            📍 このブラウザのユーザーID
          </p>
          {userId ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-2 py-1.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-400 break-all font-mono select-all">
                {userId}
              </code>
              <button
                onClick={handleCopyId}
                className="shrink-0 rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-500"
              >
                {copiedId ? "✓ コピー済み" : "コピー"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-amber-600">⏳ 読み込み中...</p>
          )}
        </div>

        {/* IDインポート */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            📲 他のブラウザ / PWA から ID をインポート
          </p>
          <p className="mb-2 text-[10px] text-gray-500 dark:text-gray-400">
            Safari で表示されている ID をコピーして、PWA のここに貼り付ける（またはその逆）ことで、
            ブックマークの保存先を統一できます。
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="ここにIDをペースト..."
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
            <button
              onClick={handleImportId}
              disabled={!importInput.trim()}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-40"
            >
              上書き保存
            </button>
          </div>
          {importStatus === "success" && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
              ✅ IDを更新しました！ショートカットの保存URLも自動で更新されています。
            </p>
          )}
          {importStatus === "error" && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              ❌ 無効なIDです。正しい形式（UUID）のIDを入力してください。
            </p>
          )}
          <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
            ⚠️ IDを変更すると、以前のIDで保存したブックマークは表示されなくなります。
            元のIDをメモしておくことをお勧めします。
          </p>
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
