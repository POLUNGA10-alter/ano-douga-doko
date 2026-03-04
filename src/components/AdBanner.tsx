"use client";

import { APP_CONFIG } from "@/config/app";
import { useEffect, useState } from "react";

/**
 * 広告バナーコンポーネント
 * APP_CONFIG.adsense.enabled = true にすると表示される
 */
export default function AdBanner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!APP_CONFIG.adsense.enabled || !isClient) return null;

  return (
    <div className="mx-auto my-4 max-w-2xl px-4">
      <div className="overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={APP_CONFIG.adsense.clientId}
          data-ad-slot={APP_CONFIG.adsense.slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <p className="py-1 text-center text-[10px] text-gray-400">
          広告
        </p>
      </div>
    </div>
  );
}
