import { APP_CONFIG } from "@/config/app";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 他のアプリへの誘導 */}
        <div className="mb-6 rounded-xl bg-primary-50 p-4 text-center dark:bg-primary-900/20">
          <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
            他の便利アプリも見てみてください
          </p>
          <div className="mt-3 flex justify-center gap-3">
            {APP_CONFIG.brand.portfolioUrl && (
              <a
                href={APP_CONFIG.brand.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-4 py-2 text-xs"
              >
                アプリ一覧を見る
              </a>
            )}
            <a
              href={`https://x.com/${APP_CONFIG.brand.twitter.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-4 py-2 text-xs"
            >
              Xをフォローする
            </a>
          </div>
        </div>

        {/* クレジット */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            © {currentYear}{" "}
            <a
              href={`https://x.com/${APP_CONFIG.brand.twitter.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {APP_CONFIG.brand.twitter}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
