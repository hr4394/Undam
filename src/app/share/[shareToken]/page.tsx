import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore } from "@/server/store";
import { FullReport } from "@/components/full-report";
import type { AccuracyGrade } from "@/domain/types";

export const metadata: Metadata = {
  title: "공유된 리포트",
  // 개인 결과는 검색 차단, OG 에 개인정보 미포함
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const report = await getStore().findReportByShareToken(shareToken);
  if (!report || report.status !== "completed" || !report.synthesis) notFound();

  return (
    <main style={{ paddingBottom: 96 }}>
      <FullReport
        chart={report.chart}
        synthesis={report.synthesis}
        grade={report.accuracyGrade as AccuracyGrade}
        nickname={report.profile.nickname}
        limited
      />
      <div className="container-m" style={{ marginTop: 8 }}>
        <div className="card" style={{ padding: 18, textAlign: "center" }}>
          <p style={{ margin: "0 0 12px", fontSize: 15 }}>
            이 리포트는 공유용 읽기 전용 화면입니다. PDF·삭제·수정은 제공되지 않습니다.
          </p>
          <Link href="/start" className="btn btn-gold" style={{ width: "100%", maxWidth: 320 }}>
            내 무료 결과 만들기
          </Link>
        </div>
      </div>

      <div className="sticky-bar">
        <div className="container-m" style={{ padding: 0 }}>
          <Link href="/" className="btn btn-primary" style={{ width: "100%" }}>
            운담 시작하기
          </Link>
        </div>
      </div>
    </main>
  );
}
