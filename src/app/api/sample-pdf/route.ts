import { NextResponse } from "next/server";
import { buildSampleReport, SAMPLE_BIRTH } from "@/server/services/sample";
import { createPdfRenderer } from "@/server/pdf/renderer";
import { pdfFileName } from "@/server/pdf/template";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 가상 인물 샘플 PDF (공개 데모/딜리버러블용). */
export async function GET() {
  const { chart, synthesis } = await buildSampleReport();
  const generatedAt = new Date().toISOString().slice(0, 10);
  const pdf = await createPdfRenderer().render({
    chart,
    synthesis,
    nickname: SAMPLE_BIRTH.nickname,
    generatedAt,
    maskCity: false,
  });
  const filename = pdfFileName(siteConfig.brand, SAMPLE_BIRTH.nickname, generatedAt);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
