import { APP_CONFIG } from "@/config/app";
import type { Metadata } from "next";

/**
 * 共通メタデータを生成する
 */
export function generateAppMetadata(overrides?: Partial<Metadata>): Metadata {
  const title = overrides?.title || APP_CONFIG.name;
  const description =
    (overrides?.description as string) || APP_CONFIG.description;

  return {
    title: {
      default: `${APP_CONFIG.name}`,
      template: `%s | ${APP_CONFIG.name}`,
    },
    description,
    authors: [{ name: APP_CONFIG.brand.author }],
    creator: APP_CONFIG.brand.author,
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: APP_CONFIG.url,
      title: `${title}`,
      description,
      siteName: APP_CONFIG.name,
      images: [
        {
          url: APP_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${APP_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title}`,
      description,
      creator: APP_CONFIG.brand.twitter,
      images: [APP_CONFIG.ogImage],
    },
    metadataBase: new URL(APP_CONFIG.url),
    ...overrides,
  };
}
