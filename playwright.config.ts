import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 설정. 모바일~데스크톱 뷰포트에서 핵심 흐름을 검증한다.
 * 개발 서버를 자동 기동하며, 이미 떠 있으면 재사용한다.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "mobile-360", use: { viewport: { width: 360, height: 800 } } },
    { name: "mobile-390", use: { ...devices["iPhone 12"] } },
    { name: "mobile-430", use: { viewport: { width: 430, height: 932 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
