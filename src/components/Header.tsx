import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        {/* アプリ名 */}
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 dark:text-white"
        >
          {APP_CONFIG.name}
        </Link>

        {/* 右側リンク */}
        <nav className="flex items-center gap-2">
          {/* ダークモード切替 */}
          <DarkModeToggle />
          {/* ポートフォリオへのリンク（他のアプリ一覧） */}
          {APP_CONFIG.brand.portfolioUrl && (
            <a
              href={APP_CONFIG.brand.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
            >
              他のアプリも見る
            </a>
          )}

          {/* X（Twitter）リンク */}
          <a
            href={`https://x.com/${APP_CONFIG.brand.twitter.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="X (Twitter)"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}
