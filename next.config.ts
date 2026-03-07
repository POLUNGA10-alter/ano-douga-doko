import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時の React Strict Mode（2回レンダリング）を無効化
  // → 本番には影響しない。開発中のパフォーマンス改善のため
  reactStrictMode: false,

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // XSS対策
          { key: "X-Content-Type-Options", value: "nosniff" },
          // クリックジャッキング防止
          { key: "X-Frame-Options", value: "DENY" },
          // リファラー制御
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HTTPS強制
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // パーミッションポリシー（不要機能の無効化）
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // API ルートには追加のキャッシュ制御
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
