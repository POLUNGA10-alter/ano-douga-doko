import { APP_CONFIG } from "@/config/app";

/**
 * アナリティクススクリプト（Umami）
 * layout.tsxの<head>に配置する
 */
export function AnalyticsScript() {
  if (!APP_CONFIG.analytics.enabled) return null;

  return (
    <script
      defer
      src={`${APP_CONFIG.analytics.umamiUrl}/script.js`}
      data-website-id={APP_CONFIG.analytics.umamiSiteId}
    />
  );
}

/**
 * カスタムイベントを送信する
 * 使い方: trackEvent("button_click", { action: "convert" })
 */
export function trackEvent(eventName: string, data?: Record<string, string | number>) {
  if (!APP_CONFIG.analytics.enabled) return;

  if (typeof window !== "undefined" && (window as unknown as { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }).umami) {
    (window as unknown as { umami: { track: (name: string, data?: Record<string, string | number>) => void } }).umami.track(eventName, data);
  }
}
