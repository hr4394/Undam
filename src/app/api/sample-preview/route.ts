import { NextResponse } from "next/server";
import { buildSampleReport, SAMPLE_BIRTH } from "@/server/services/sample";
import { renderPdfHtml } from "@/server/pdf/template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 개발용: PDF 템플릿 HTML 을 그대로 반환(시각 QA/스크린샷). */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("disabled", { status: 404 });
  }
  const { chart, synthesis } = await buildSampleReport();
  const html = renderPdfHtml({
    chart,
    synthesis,
    nickname: SAMPLE_BIRTH.nickname,
    generatedAt: new Date().toISOString().slice(0, 10),
  });
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
