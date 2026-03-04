"use client";

import { useState } from "react";
import { APP_CONFIG } from "@/config/app";

interface ShareButtonsProps {
  /** シェアするURL（省略時は現在のページURL） */
  url?: string;
  /** シェア時のテキスト */
  text?: string;
}

/**
 * SNSシェアボタン（X / LINE / コピー）
 */
export default function ShareButtons({ url, text }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || `${APP_CONFIG.name} - ${APP_CONFIG.description}`;

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&via=${APP_CONFIG.brand.twitter.replace("@", "")}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {/* X (Twitter) シェア */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        シェア
      </a>

      {/* LINE シェア */}
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-xl bg-[#06C755] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
      >
        LINE
      </a>

      {/* URL コピー */}
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {copied ? "✓ コピーした" : "📋 コピー"}
      </button>
    </div>
  );
}
