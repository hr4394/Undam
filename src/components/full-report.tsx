import type { ChartResult } from "@/domain/pipeline";
import type { Synthesis } from "@/domain/synthesis/schema";
import type { AccuracyGrade } from "@/domain/types";
import { AccuracyBadge, DistributionBars, KeywordChips, SectionCard } from "./report-ui";
import { FIVE_ELEMENT_LABELS } from "@/domain/types";
import { ASTRO_ELEMENT_KO } from "@/domain/astrology/tables";

const SECTIONS = [
  { id: "summary", label: "요약" },
  { id: "nature", label: "성향" },
  { id: "work", label: "일과 돈" },
  { id: "rel", label: "관계" },
  { id: "action", label: "행동" },
];

function elementCounts(chart: ChartResult) {
  const saju: Record<string, number> = {};
  for (const [k, v] of Object.entries(chart.saju.elementCounts))
    saju[FIVE_ELEMENT_LABELS[k as keyof typeof FIVE_ELEMENT_LABELS]] = v;
  const astro: Record<string, number> = {};
  for (const [k, v] of Object.entries(chart.astrology.elementCounts))
    astro[ASTRO_ELEMENT_KO[k as keyof typeof ASTRO_ELEMENT_KO]] = v;
  return { saju, astro };
}

/**
 * 전체 종합 리포트 본문. /report, /sample, (제한 모드로) /share 에서 재사용.
 * limited=true 면 공유용 축약(행동/근거 일부 숨김, PDF/삭제 없음).
 */
export function FullReport({
  chart,
  synthesis,
  grade,
  nickname,
  limited = false,
}: {
  chart: ChartResult;
  synthesis: Synthesis;
  grade: AccuracyGrade;
  nickname: string;
  limited?: boolean;
}) {
  const { saju, astro } = elementCounts(chart);
  const sun = chart.astrology.planets.find((p) => p.key === "sun");
  const moon = chart.astrology.planets.find((p) => p.key === "moon");

  return (
    <div>
      {/* 상단 헤더 */}
      <header className="night-header" style={{ padding: "28px 0 24px" }}>
        <div className="container-m">
          <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>{nickname}님의 종합 리포트</p>
          <h1 style={{ fontSize: 24, margin: "8px 0 12px" }}>{synthesis.headline}</h1>
          <div style={{ marginBottom: 12 }}>
            <KeywordChips keywords={synthesis.keywords} />
          </div>
          <AccuracyBadge grade={grade} />
        </div>
      </header>

      {/* 섹션 탐색 탭 */}
      <nav className="container-m" aria-label="섹션 이동">
        <div className="section-tabs">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="section-tab">{s.label}</a>
          ))}
        </div>
      </nav>

      <div className="container-m" style={{ display: "grid", gap: 14, marginTop: 8, paddingBottom: 24 }}>
        <SectionCard id="summary" title="20초 핵심 요약">
          <p style={{ margin: 0 }}>{synthesis.summary}</p>
        </SectionCard>

        {synthesis.lifeStory && (
          <SectionCard title={synthesis.lifeStory.title}>
            <p style={{ margin: 0 }}>{synthesis.lifeStory.narrative}</p>
          </SectionCard>
        )}

        <SectionCard id="nature" title="겉모습과 내면">
          {synthesis.coreInsights.map((ci, i) => (
            <div key={i} style={{ marginBottom: i < synthesis.coreInsights.length - 1 ? 18 : 0 }}>
              <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>{ci.title}</h3>
              <p style={{ margin: "0 0 8px" }}>{ci.insight}</p>
              <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text-secondary)" }}>
                <strong>일상 패턴</strong> · {ci.realLifePattern}
              </p>
              {!limited && (
                <div style={{ display: "grid", gap: 4, fontSize: 14 }}>
                  <p style={{ margin: 0 }}><strong style={{ color: "#2f6b3a" }}>강점</strong> {ci.strength}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: "var(--accent-red)" }}>주의</strong> {ci.caution}</p>
                  <p style={{ margin: 0 }}><strong style={{ color: "var(--secondary)" }}>활용</strong> {ci.action}</p>
                </div>
              )}
            </div>
          ))}
        </SectionCard>

        <SectionCard title="사주에서 본 나">
          <p style={{ marginTop: 0 }}>
            일간은 <strong>{saju && chart.saju.dayMasterKo}({chart.saju.dayMaster})</strong>이고,
            절기 기준 월주는 <strong>{chart.saju.pillars.month.stemKo}{chart.saju.pillars.month.branchKo}</strong>입니다.
            {chart.saju.pillars.hour
              ? ` 시주는 ${chart.saju.pillars.hour.stemKo}${chart.saju.pillars.hour.branchKo}.`
              : " 출생 시간 미상으로 시주는 계산하지 않았습니다."}
          </p>
          <div style={{ marginTop: 14 }}>
            <DistributionBars title="오행 분포" counts={saju} />
          </div>
          {chart.saju.tenGods.length > 0 && (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 12, marginBottom: 0 }}>
              십성: {chart.saju.tenGods.join(", ")}
            </p>
          )}
        </SectionCard>

        <SectionCard title="서양점성술에서 본 나">
          <p style={{ marginTop: 0 }}>
            태양 <strong>{sun?.signKo}</strong>, 달 <strong>{moon?.signKo}</strong>
            {chart.astrology.ascendant ? `, 상승궁 ${chart.astrology.ascendant.signKo}` : " (상승궁 미확정)"}.
            {chart.astrology.moonSignAmbiguous && chart.astrology.moonAltSign
              ? ` 출생 시간 미상으로 달은 ${chart.astrology.moonAltSign.signKo}일 가능성도 있습니다.`
              : ""}
          </p>
          <div style={{ marginTop: 14 }}>
            <DistributionBars title="원소 분포 (불·흙·공기·물)" counts={astro} />
          </div>
        </SectionCard>

        <SectionCard title="두 체계가 공통으로 말하는 것">
          {synthesis.convergences.map((c, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>{c.title}</h3>
              <p style={{ margin: 0 }}>{c.description}</p>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="두 체계가 다르게 말하는 내적 긴장">
          <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>{synthesis.tension.title}</h3>
          <p style={{ margin: "0 0 8px" }}>{synthesis.tension.description}</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--secondary)" }}>
            <strong>통합 조언</strong> · {synthesis.tension.integrationAdvice}
          </p>
        </SectionCard>

        <SectionCard id="work" title="일과 돈을 대하는 방식">
          <p style={{ marginTop: 0 }}>{synthesis.workAndMoney.summary}</p>
          <p style={{ margin: "8px 0", fontSize: 14 }}>
            <strong>잘 맞는 환경</strong> · {synthesis.workAndMoney.goodEnvironment.join(" / ")}
          </p>
          <p style={{ margin: "8px 0", fontSize: 14 }}>
            <strong>결정 방식</strong> · {synthesis.workAndMoney.decisionPattern}
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--secondary)" }}>
            <strong>행동</strong> · {synthesis.workAndMoney.action}
          </p>
        </SectionCard>

        <SectionCard id="rel" title="연애와 인간관계">
          <p style={{ marginTop: 0 }}>{synthesis.relationships.summary}</p>
          <p style={{ margin: "8px 0", fontSize: 14 }}><strong>표현 방식</strong> · {synthesis.relationships.expressionStyle}</p>
          <p style={{ margin: "8px 0", fontSize: 14 }}><strong>갈등 패턴</strong> · {synthesis.relationships.conflictPattern}</p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--secondary)" }}><strong>행동</strong> · {synthesis.relationships.action}</p>
        </SectionCard>

        <SectionCard title="스트레스와 회복">
          <p style={{ marginTop: 0 }}>{synthesis.stressAndRecovery.summary}</p>
          <p style={{ margin: "8px 0", fontSize: 14 }}><strong>스트레스 패턴</strong> · {synthesis.stressAndRecovery.stressPattern}</p>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 14 }}>
            {synthesis.stressAndRecovery.recoverySuggestions.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </SectionCard>

        <SectionCard id="action" title="오늘부터 적용할 행동 3가지">
          <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
            {synthesis.actions.map((a, i) => (
              <li key={i}>
                <span style={{ fontSize: 12, color: "var(--secondary)", fontWeight: 700, marginRight: 6 }}>
                  {a.period === "today" ? "오늘" : a.period === "work" ? "일" : "관계"}
                </span>
                {a.action}
              </li>
            ))}
          </ol>
        </SectionCard>

        {!limited && (
          <SectionCard title="정확도와 한계">
            <p style={{ marginTop: 0, fontSize: 14, color: "var(--text-secondary)" }}>
              {synthesis.confidence.reason}
            </p>
            <ul style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10, paddingLeft: 16, lineHeight: 1.8 }}>
              {synthesis.limitations.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
