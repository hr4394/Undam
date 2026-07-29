import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/guide", "/sample"],
      // 개인 결과/결제/입력/관리자 페이지는 크롤링 차단
      disallow: ["/preview/", "/checkout/", "/report/", "/share/", "/start", "/admin", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
