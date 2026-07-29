// 모바일 시각 QA + 전체 사용자 흐름 스크린샷.
// 사용법: 개발 서버(localhost:3000)가 떠 있는 상태에서 `node scripts/screenshots.mjs`
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "samples/screenshots";
mkdirSync(OUT, { recursive: true });

const MOBILE = { width: 390, height: 844 };

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log("saved", name);
}

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: MOBILE, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // 1) 랜딩
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await shot(page, "01-landing");

  // 2) 입력 시작
  await page.goto(`${BASE}/start`, { waitUntil: "networkidle" });
  await shot(page, "02-start-step1");

  // 단계별 입력 진행
  await page.fill("#nickname", "김하늘");
  await page.getByRole("button", { name: "다음" }).click();
  // step2 날짜
  await page.fill("#y", "1993");
  await page.fill("#m", "7");
  await page.fill("#dd", "12");
  await page.getByRole("button", { name: "다음" }).click();
  // step3 시간
  await page.fill("#hh", "9");
  await page.fill("#mm", "40");
  await shot(page, "03-start-time");
  await page.getByRole("button", { name: "다음" }).click();
  // step4 도시
  await page.fill("#city", "서울");
  await page.getByRole("button", { name: /서울/ }).first().click();
  await page.getByRole("button", { name: "다음" }).click();
  // step5 관심
  await page.getByRole("button", { name: "타고난 성향" }).click();
  await page.getByRole("button", { name: "직업과 적성" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  // step6 동의
  await shot(page, "04-start-consent");
  await page.getByText("이용약관에 동의").click();
  await page.getByText("개인정보 처리").click();
  await page.getByText("만 14세 이상").click();

  await Promise.all([
    page.waitForURL(/\/preview\//, { timeout: 30000 }),
    page.getByRole("button", { name: "무료 결과 확인하기" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  await shot(page, "05-preview-free");

  // 무료 모드: 전체 리포트 무료로 보기 → 바로 리포트
  await Promise.all([
    page.waitForURL(/\/report\//, { timeout: 60000 }),
    page.getByRole("button", { name: /전체 리포트 무료로 보기/ }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  await shot(page, "07-report-full");

  // 샘플 페이지
  await page.goto(`${BASE}/sample`, { waitUntil: "networkidle" });
  await shot(page, "08-sample");

  // PDF 템플릿(A4 폭) — 한글 렌더 확인
  const a4 = await browser.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  const p2 = await a4.newPage();
  await p2.goto(`${BASE}/api/sample-preview`, { waitUntil: "networkidle" });
  await p2.screenshot({ path: `${OUT}/09-pdf-template.png` });
  console.log("saved 09-pdf-template");

  console.log("DONE");
} catch (e) {
  console.error("SCREENSHOT ERROR:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
