import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時の React Strict Mode（2回レンダリング）を無効化
  // → 本番には影響しない。開発中のパフォーマンス改善のため
  reactStrictMode: false,
};

export default nextConfig;
