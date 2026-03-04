# 🎬 あの動画どこ？

> YouTube、TikTok、Instagram、X、ニコニコ…全プラットフォームのお気に入り動画が1箇所にまとまる棚

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` を作成（`.env.local.example` を参考）:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Supabase テーブル作成

Supabase のSQL Editorで以下を実行:

```sql
CREATE TABLE bookmarks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  url           TEXT NOT NULL,
  title         TEXT,
  thumbnail     TEXT,
  platform      TEXT,
  content_type  TEXT DEFAULT 'unknown',
  duration      TEXT,
  tags          TEXT[] DEFAULT '{}',
  memo          TEXT DEFAULT '',
  site_name     TEXT,
  video_url     TEXT,
  video_source  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6366F1',
  sort_order  INT DEFAULT 0
);
```

### 4. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 で確認。

### 5. デプロイ

```powershell
npx vercel         # 初回
npx vercel --prod  # 以降の更新
```

---

## プロジェクト構成

```
src/
├── app/
│   ├── globals.css              # 共通デザインテーマ
│   ├── layout.tsx               # 共通レイアウト
│   ├── page.tsx                 # トップページ（ブックマーク一覧）
│   ├── share/
│   │   └── page.tsx             # 共有メニューからの保存画面
│   └── api/
│       ├── bookmark/
│       │   └── route.ts         # ブックマークCRUD API
│       └── metadata/
│           └── route.ts         # メタ情報取得API
├── components/
│   ├── BookmarkCard.tsx         # サムネ付き動画カード
│   ├── BookmarkList.tsx         # カード一覧表示
│   ├── TagFilter.tsx            # タグフィルタUI
│   ├── PlatformFilter.tsx       # プラットフォームフィルタUI
│   ├── AddBookmarkForm.tsx      # URL手動入力フォーム
│   ├── SaveConfirmation.tsx     # 保存確認画面
│   ├── Header.tsx               # 共通ヘッダー
│   ├── Footer.tsx               # 共通フッター
│   ├── ShareButtons.tsx         # SNSシェアボタン
│   └── AdBanner.tsx             # 広告枠
├── config/
│   └── app.ts                   # アプリ固有の設定値
├── hooks/
│   ├── useBookmarks.ts          # ブックマークCRUDロジック
│   └── useUserId.ts             # 匿名ユーザーID管理
├── lib/
│   ├── supabase.ts              # Supabase接続
│   ├── metadata-fetcher.ts      # URLからメタ情報取得
│   ├── platform-detector.ts     # プラットフォーム判定
│   ├── analytics.tsx            # アクセス解析
│   └── metadata.ts              # OGPメタタグ生成
├── types/
│   └── bookmark.ts              # 型定義
public/
├── manifest.json                # PWA設定（Share Target含む）
└── og-image.png                 # OGP画像（1200×630px）
```

## 開発フェーズ

| フェーズ | 内容 | 状態 |
|---|---|---|
| Phase 1 | Webアプリ本体（URL入力→メタ情報取得→保存→一覧表示） | ✅ ひな形完了 |
| Phase 2 | PWA Share Target（共有メニューから保存） | ✅ manifest設定済 |
| Phase 3 | LINE Bot連携 | 🔲 未着手 |
| Phase 4 | タグ管理・フィルタ・検索 | 🔲 未着手 |
| Phase 5 | Chrome拡張 | 🔲 未着手 |

