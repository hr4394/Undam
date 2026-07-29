import { renderPdfHtml } from "./template";
import type { ChartResult } from "@/domain/pipeline";
import type { Synthesis } from "@/domain/synthesis/schema";

export interface PdfInput {
  chart: ChartResult;
  synthesis: Synthesis;
  nickname: string;
  generatedAt: string;
  maskCity?: boolean;
}

export interface PdfRenderer {
  render(input: PdfInput): Promise<Uint8Array>;
}

/**
 * Playwright(chromium) 기반 렌더러.
 * - HTML 인쇄 템플릿을 headless chromium 으로 A4 PDF 변환(우선순위 1).
 * - playwright 는 동적 import 하여 일반 페이지 번들에 포함되지 않게 한다.
 * - Vercel 배포 시에는 @sparticuz/chromium + playwright-core 로 교체한다(README 참조).
 */
export class PlaywrightPdfRenderer implements PdfRenderer {
  async render(input: PdfInput): Promise<Uint8Array> {
    const html = renderPdfHtml(input);
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ args: ["--no-sandbox"] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });
      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
      });
      return buffer;
    } finally {
      await browser.close();
    }
  }
}

export function createPdfRenderer(): PdfRenderer {
  return new PlaywrightPdfRenderer();
}
