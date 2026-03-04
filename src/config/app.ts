// ===================================
// あの動画どこ？ - アプリ固有の設定
// ===================================

export const APP_CONFIG = {
  // --- 基本情報 ---
  name: "あの動画どこ？",
  description:
    "YouTube、TikTok、Instagram、X、ニコニコ…全プラットフォームのお気に入り動画が1箇所にまとまる棚",
  url: "https://ano-douga-doko.vercel.app",

  // --- ブランド ---
  brand: {
    author: "@zunda_katte_app",
    twitter: "@zunda_katte_app",
    portfolioUrl: "", // ポートフォリオサイトURL（後日追加）
  },

  // --- テーマカラー ---
  theme: {
    primary: "#6366F1", // インディゴ（動画棚らしい落ち着いた色）
    primaryLight: "#818CF8",
    primaryDark: "#4338CA",
    accent: "#F59E0B", // アンバー
  },

  // --- SNSシェア ---
  ogImage: "/og-image.png",

  // --- 広告 ---
  adsense: {
    enabled: false,
    clientId: "", // ca-pub-xxxxx
    slotId: "", // xxxxxxx
  },

  // --- アナリティクス ---
  analytics: {
    enabled: false,
    umamiSiteId: "",
    umamiUrl: "",
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
