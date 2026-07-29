import type { Metadata } from "next";
import Link from "next/link";
import { buildSampleReport, SAMPLE_BIRTH } from "@/server/services/sample";
import { FullReport } from "@/components/full-report";

export const metadata: Metadata = {
  title: "샘플 리포트 (가상 인물)",
  description: "가상 인물의 사주 × 서양점성술 종합 리포트 예시입니다. 실제 결과 구성을 미리 확인해 보세요.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/sample" },
};

export default async function SamplePage() {
  const { chart, synthesis } = await buildSampleReport();
  return (
    <main style={{ paddingBottom: 96 }}>
      <div style={{ background: "#fff7e6", borderBottom: "1px solid rgba(184,146,74,0.3)" }}>
        <div className="container-m" style={{ padding: "10px 16px", fontSize: 13, color: "#8a6a1f" }}>
          이 페이지는 <strong>가상 인물 “{SAMPLE_BIRTH.nickname}”</strong>의 예시입니다. 실제 개인정보가 아닙니다.
        </div>
      </div>
      <FullReport
        chart={chart}
        synthesis={synthesis}
        grade={chart.accuracy.grade}
        nickname={SAMPLE_BIRTH.nickname}
      />
      <div className="sticky-bar">
        <div className="container-m" style={{ padding: 0 }}>
          <Link href="/start" className="btn btn-gold" style={{ width: "100%" }}>
            내 리포트 무료로 시작하기
          </Link>
        </div>
      </div>
    </main>
  );
}
