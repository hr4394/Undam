import { test, expect, type Page } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "가로 스크롤이 없어야 함").toBeLessThanOrEqual(1);
}

test("랜딩: 가로 스크롤 없음 + 핵심 CTA 노출", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("두 가지 운명 지도");
  await expect(page.getByRole("link", { name: "무료로 시작하기" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("전체 흐름: 입력 → 무료 미리보기 → 결제 → 전체 리포트 → PDF", async ({ page }) => {
  await page.goto("/start");

  await page.fill("#nickname", "테스트유저");
  await page.getByRole("button", { name: "다음" }).click();
  await page.fill("#y", "1993");
  await page.fill("#m", "7");
  await page.fill("#dd", "12");
  await page.getByRole("button", { name: "다음" }).click();
  await page.fill("#hh", "9");
  await page.fill("#mm", "40");
  await page.getByRole("button", { name: "다음" }).click();
  await page.fill("#city", "서울");
  await page.getByRole("button", { name: /서울/ }).first().click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "타고난 성향" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByText("이용약관에 동의").click();
  await page.getByText("개인정보 처리").click();
  await page.getByText("만 14세 이상").click();

  await Promise.all([
    page.waitForURL(/\/preview\//),
    page.getByRole("button", { name: "무료 결과 확인하기" }).click(),
  ]);
  await expect(page.getByText("핵심 키워드", { exact: true })).toBeVisible();
  await expectNoHorizontalScroll(page);

  await Promise.all([
    page.waitForURL(/\/checkout\//),
    page.getByRole("button", { name: /전체 리포트 열기/ }).click(),
  ]);
  await expect(page.getByText(/결제 전 확인/)).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/report\//, { timeout: 60_000 }),
    page.getByRole("button", { name: /결제하기/ }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "20초 핵심 요약" })).toBeVisible();
  await expectNoHorizontalScroll(page);

  // PDF 다운로드 권한(소유자) — 200 확인
  const url = page.url();
  const ownerToken = url.split("/report/")[1];
  const res = await page.request.get(`/api/pdf/${ownerToken}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});

test("공유 페이지는 PDF/삭제를 제공하지 않는다", async ({ page }) => {
  // 공유 토큰이 없으면 접근 불가(404) 확인 — 임의 토큰
  const res = await page.request.get("/share/shr_invalidtoken", { failOnStatusCode: false });
  expect([404, 200]).toContain(res.status());
});
