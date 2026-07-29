import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getPrimaryProduct } from "@/config/products";
import { ConstellationDecor, AstrolabeDecor } from "@/components/decorations";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  const product = getPrimaryProduct();
  const price = product.amount.toLocaleString("ko-KR");
  const reportLabel = siteConfig.freeMode ? "전체 리포트 무료" : `전체 리포트 ${price}원`;

  return (
    <main>
      {/* 히어로 */}
      <section className="night-header" style={{ paddingTop: 48, paddingBottom: 56 }}>
        <ConstellationDecor />
        <div
          className="container-m"
          style={{ position: "relative", textAlign: "center" }}
        >
          <p style={{ letterSpacing: "0.3em", fontSize: 13, opacity: 0.8, marginBottom: 14 }}>
            {siteConfig.brand} · 運談
          </p>
          <h1 style={{ fontSize: 30, margin: "0 auto 16px", maxWidth: 520 }}>
            동양의 사주와 서양의 별자리로 읽는
            <br />
            나의 두 가지 운명 지도
          </h1>
          <p style={{ fontSize: 16, opacity: 0.9, maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.8 }}>
            {siteConfig.subCopy}
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <AstrolabeDecor size={180} />
          </div>
          <Link href="/start" className="btn btn-gold" style={{ width: "100%", maxWidth: 340 }}>
            무료로 시작하기
          </Link>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16, fontSize: 13, opacity: 0.85 }}>
            <span>회원가입 없이 이용</span>
            <span aria-hidden>·</span>
            <span>{reportLabel}</span>
            <span aria-hidden>·</span>
            <span>약 1분 소요</span>
          </div>
        </div>
      </section>

      {/* 특징 */}
      <section className="container-m" style={{ marginTop: 28 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            {
              t: "두 체계를 교차 분석합니다",
              d: "사주와 서양점성술을 단순 나열하지 않고, 두 관점이 공통으로 가리키는 성향과 서로 다르게 나타나는 내적 긴장을 함께 정리합니다.",
            },
            {
              t: "계산은 코드로, 해석만 AI로",
              d: "생년월일·시간·출생지를 검증된 계산 모듈로 사주 원국과 출생 차트를 산출한 뒤, 그 결과만 해석합니다. AI가 팔자를 추측하지 않습니다.",
            },
            {
              t: "모바일에서 3~5분",
              d: "짧지만 밀도 있는 리포트. 결제 후 즉시 열람하고 PDF로 저장하거나 비공개 링크로 다시 볼 수 있습니다.",
            },
          ].map((f) => (
            <div key={f.t} className="card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{f.t}</h2>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>{f.d}</p>
            </div>
          ))}
        </div>

        <div className="gold-divider" style={{ margin: "28px 0" }} />

        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 17, marginTop: 0 }}>무료로 확인하는 것</h2>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9 }}>
            <li>사주·점성술 핵심 키워드</li>
            <li>오행 분포 · 점성술 원소 분포</li>
            <li>두 체계의 공통점 한 문장 + 전체 목차 미리보기</li>
          </ul>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12, marginBottom: 0 }}>
            {siteConfig.freeMode ? "전체 리포트(무료)는" : `전체 리포트(${price}원)는`} 겉모습과 내면, 일과 돈, 관계, 스트레스와 회복, 오늘부터의 행동까지 이어집니다.
          </p>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 20, lineHeight: 1.7 }}>
          공포·불안을 이용하지 않으며, 질병·사고·이혼·파산 등을 예언하지 않습니다. 결과는 참고
          자료입니다.
        </p>
      </section>

      <SiteFooter />

      {/* 하단 sticky CTA */}
      <div className="sticky-bar">
        <div className="container-m" style={{ padding: 0 }}>
          <Link href="/start" className="btn btn-primary" style={{ width: "100%" }}>
            무료 결과 확인하기
          </Link>
        </div>
      </div>
    </main>
  );
}
