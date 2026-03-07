import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時の React Strict Mode（2回レンダリング）を無効化
  // → 本番には影響しない。開発中のパフォーマンス改善のため
  reactStrictMode: false,

  // セキュリティヘッダー
  async headers() {
    // 全ルート共通のセキュリティヘッダー（X-Frame-Options 以外）
    const commonSecurityHeaders = [
      // XSS対策
      { key: "X-Content-Type-Options", value: "nosniff" },
      // リファラー制御
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // HTTPS強制
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      // パーミッションポリシー（不要機能の無効化）
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        // 全ルート共通
        source: "/(.*)",
        headers: commonSecurityHeaders,
      },
      {
        // フロントエンドページ: クリックジャッキング防止
        // ※ /api は除外（iOSショートカットのWebView表示でブロックされるため）
        source: "/",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
      {
        source: "/tools",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
      {
        source: "/share",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
      {
        source: "/shared",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
      {
        // API ルート: キャッシュ無効化
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
