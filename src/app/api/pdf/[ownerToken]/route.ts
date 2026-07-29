import { NextResponse } from "next/server";
import { getStore } from "@/server/store";
import { createPdfRenderer } from "@/server/pdf/renderer";
import { pdfFileName } from "@/server/pdf/template";
import { siteConfig } from "@/config/site";

// PDF 생성은 무겁고 chromium 이 필요하므로 Node 런타임 사용.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 소유자 PDF 다운로드.
 * - 요청마다 서버에서 소유자 권한 재검증(토큰 해시 대조).
 * - 결제 완료(status=completed)된 리포트만 생성.
 * - 소유자 토큰/DB ID 는 PDF 에 포함하지 않는다.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ownerToken: string }> },
) {
  const { ownerToken } = await params;
  const report = await getStore().findReportByOwnerToken(ownerToken);
  if (!report || report.status !== "completed" || !report.synthesis) {
    return new NextResponse("Not found or not ready", { status: 404 });
  }

  const generatedAt = new Date().toISOString().slice(0, 10);
  let pdf: Uint8Array;
  try {
    pdf = await createPdfRenderer().render({
      chart: report.chart,
      synthesis: report.synthesis,
      nickname: report.profile.nickname,
      generatedAt,
      maskCity: false,
    });
  } catch {
    // PDF 실패가 웹 리포트 열람에 영향을 주지 않도록 별도 오류 응답
    return new NextResponse("PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.", { status: 500 });
  }

  const filename = pdfFileName(siteConfig.brand, report.profile.nickname, generatedAt);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
