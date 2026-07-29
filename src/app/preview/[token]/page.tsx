import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore } from "@/server/store";
import { getPrimaryProduct } from "@/config/products";
import { siteConfig } from "@/config/site";
import { startCheckoutAction } from "@/app/actions";
import { FreeReportButton } from "./FreeReportButton";
import { AccuracyBadge, DistributionBars, KeywordChips } from "@/components/report-ui";
import { ACCURACY_LABEL } from "@/domain/accuracy";
import type { AccuracyGrade } from "@/domain/types";

export const metadata: Metadata = {
  title: "무료 미리보기",
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getStore().findReportByOwnerToken(token);
  if (!report || !report.freePreview) notFound();

  const fp = report.freePreview;
  const product = getPrimaryProduct();
  const price = product.amount.toLocaleString("ko-KR");
  // 이미 결제/생성 완료면 전체 리포트로 안내
  const paid = report.status === "completed";

  return (
    <main style={{ paddingBottom: 100 }}>
      <header className="night-header" style={{ padding: "26px 0 22px" }}>
        <div className="container-m">
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{report.profile.nickname}님의 무료 미리보기</p>
          <h1 style={{ fontSize: 22, margin: "8px 0 12px" }}>두 지도의 첫 신호</h1>
          <AccuracyBadge grade={fp.accuracyGrade as AccuracyGrade} />
        </div>
      </header>

      <div className="container-m" style={{ display: "grid", gap: 14, marginTop: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <p className="label">핵심 키워드</p>
          <KeywordChips keywords={[fp.sajuKeyword, fp.astrologyKeyword]} />
          <p style={{ marginTop: 14, marginBottom: 0 }}>{fp.commonSentence}</p>
        </div>

        <div className="card" style={{ padding: 18, display: "grid", gap: 20 }}>
          <DistributionBars title="사주 오행 분포" counts={fp.elementCounts} />
          <DistributionBars title="점성술 원소 분포" counts={fp.astroElementCounts} />
        </div>

        <div className="card" style={{ padding: 18 }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 0 }}>
            정확도: {ACCURACY_LABEL[fp.accuracyGrade as AccuracyGrade]}
            {fp.accuracyReasons.length ? ` · ${fp.accuracyReasons.join(", ")}` : ""}
          </p>
          <p className="label" style={{ marginTop: 8 }}>전체 리포트 목차</p>
          <ol style={{ margin: "6px 0 0", paddingLeft: 18, columns: 1, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9 }}>
            {fp.tableOfContents.map((t) => <li key={t}>{t}</li>)}
          </ol>
          <div className="gold-divider" style={{ margin: "16px 0" }} />
          <p style={{ margin: 0, fontSize: 15 }}>{fp.teaser}</p>
        </div>

        {/* 고지 */}
        <div className="card" style={{ padding: 16, background: "var(--surface)" }}>
          <p className="label" style={{ marginBottom: 8 }}>안내</p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            {siteConfig.freeMode ? (
              <>
                <li>전체 리포트는 <strong style={{ color: "var(--text-primary)" }}>무료</strong>로 제공됩니다.</li>
                <li>포함: 전체 종합 리포트 열람 + PDF 다운로드 + 비공개 재접속</li>
                <li>결과는 자기이해·오락용 참고 자료입니다 — <Link href="/disclaimer">면책 고지</Link></li>
                <li>개인정보: 계산·해석에만 사용 — <Link href="/privacy">처리방침</Link></li>
              </>
            ) : (
              <>
                <li>실제 결제금액: <strong style={{ color: "var(--text-primary)" }}>{price}원 (VAT 포함)</strong></li>
                <li>포함: 전체 종합 리포트 열람 + PDF 다운로드 + 비공개 재접속</li>
                <li>제공 시점: 결제 완료 즉시 (디지털 콘텐츠)</li>
                <li>환불: 콘텐츠 특성상 열람 후 환불 제한 — <Link href="/refund">환불정책</Link></li>
                <li>개인정보: 계산·해석에만 사용 — <Link href="/privacy">처리방침</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="sticky-bar">
        <div className="container-m" style={{ padding: 0 }}>
          {paid ? (
            <Link href={`/report/${token}`} className="btn btn-gold" style={{ width: "100%" }}>
              전체 리포트 열기
            </Link>
          ) : siteConfig.freeMode ? (
            <FreeReportButton ownerToken={token} />
          ) : (
            <form action={startCheckoutAction}>
              <input type="hidden" name="ownerToken" value={token} />
              <button type="submit" className="btn btn-gold" style={{ width: "100%" }}>
                전체 리포트 열기 · {price}원
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
