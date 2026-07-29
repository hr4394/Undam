import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore } from "@/server/store";
import { FullReport } from "@/components/full-report";
import { ReportActions } from "./ReportActions";
import type { AccuracyGrade } from "@/domain/types";

export const metadata: Metadata = {
  title: "종합 리포트",
  robots: { index: false, follow: false },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ ownerToken: string }>;
}) {
  const { ownerToken } = await params;
  const report = await getStore().findReportByOwnerToken(ownerToken);
  if (!report) notFound();

  // 결제 전(pending) → 미리보기로
  if (report.status === "pending") {
    return (
      <main className="container-m" style={{ paddingTop: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>아직 결제되지 않았습니다</h1>
        <p style={{ color: "var(--text-secondary)" }}>무료 미리보기에서 전체 리포트를 결제해 주세요.</p>
        <Link href={`/preview/${ownerToken}`} className="btn btn-primary" style={{ marginTop: 12 }}>미리보기로 가기</Link>
      </main>
    );
  }

  // 생성 실패/진행 → 복구 안내
  if (report.status === "failed") {
    return (
      <main className="container-m" style={{ paddingTop: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>리포트 생성에 문제가 있었습니다</h1>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          결제는 정상 처리되었습니다. 잠시 후 자동으로 다시 시도되며, 계속 실패하면 환불 처리됩니다.
          이 페이지를 새로고침해 상태를 확인하세요.
        </p>
      </main>
    );
  }

  if (report.status !== "completed" || !report.synthesis) {
    return (
      <main className="container-m" style={{ paddingTop: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>리포트를 정리하고 있어요</h1>
        <p style={{ color: "var(--text-secondary)" }}>잠시 후 새로고침해 주세요.</p>
      </main>
    );
  }

  return (
    <main style={{ paddingBottom: 96 }}>
      <FullReport
        chart={report.chart}
        synthesis={report.synthesis}
        grade={report.accuracyGrade as AccuracyGrade}
        nickname={report.profile.nickname}
      />
      <ReportActions ownerToken={ownerToken} />
    </main>
  );
}
