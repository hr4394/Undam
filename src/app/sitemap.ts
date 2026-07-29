import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { GUIDE_ARTICLES } from "@/content/guide";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const staticPaths = ["", "/sample", "/guide", "/privacy", "/terms", "/refund", "/disclaimer", "/contact"];
  // 개인 결과 페이지(/report,/share,/preview)는 sitemap 에서 제외.
  return [
    ...staticPaths.map((p) => ({
      url: `${base}${p}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.6,
    })),
    ...GUIDE_ARTICLES.map((a) => ({
      url: `${base}/guide/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
