import type { ChartResult } from "@/domain/pipeline";
import type { Synthesis } from "@/domain/synthesis/schema";
import { FIVE_ELEMENT_LABELS } from "@/domain/types";
import { ASTRO_ELEMENT_KO } from "@/domain/astrology/tables";
import { siteConfig } from "@/config/site";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function bars(counts: Record<string, number>): string {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([k, v]) => {
      const pct = Math.round((v / total) * 100);
      return `<div class="bar-row"><span class="bar-label">${esc(k)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.max(pct, 3)}%"></span></span>
        <span class="bar-val">${v} · ${pct}%</span></div>`;
    })
    .join("");
}

/**
 * A4 인쇄용 PDF HTML 템플릿. 웹 화면 캡처가 아니라 별도 인쇄 레이아웃.
 * - 아이보리 배경, 남색 제목, 금색 구분선, 명조 제목/고딕 본문
 * - 소유자 토큰/DB ID 미포함, 페이지 번호(@page)
 * - 한글 폰트는 헤드리스 브라우저의 시스템 한글 폰트로 렌더(Malgun Gothic 등)
 */
export function renderPdfHtml(opts: {
  chart: ChartResult;
  synthesis: Synthesis;
  nickname: string;
  generatedAt: string;
  maskCity?: boolean;
}): string {
  const { chart, synthesis, nickname, generatedAt } = opts;
  const s = chart.saju;
  const a = chart.astrology;
  const sun = a.planets.find((p) => p.key === "sun");
  const moon = a.planets.find((p) => p.key === "moon");

  const sajuElements: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.elementCounts))
    sajuElements[FIVE_ELEMENT_LABELS[k as keyof typeof FIVE_ELEMENT_LABELS]] = v;
  const astroElements: Record<string, number> = {};
  for (const [k, v] of Object.entries(a.elementCounts))
    astroElements[ASTRO_ELEMENT_KO[k as keyof typeof ASTRO_ELEMENT_KO]] = v;

  const cityLabel = opts.maskCity
    ? chart.normalized.cityLabel.split(" · ")[0] + " · ***"
    : chart.normalized.cityLabel;

  const g = chart.normalized.gregorian;
  const insights = synthesis.coreInsights
    .map(
      (ci) => `<div class="insight">
      <h3>${esc(ci.title)}</h3>
      <p>${esc(ci.insight)}</p>
      <p class="dim"><b>일상 패턴</b> ${esc(ci.realLifePattern)}</p>
      <p class="dim"><b>강점</b> ${esc(ci.strength)} · <b>주의</b> ${esc(ci.caution)}</p>
      <p class="dim"><b>활용</b> ${esc(ci.action)}</p>
    </div>`,
    )
    .join("");

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<title>${esc(siteConfig.brand)} 종합 리포트</title>
<style>
  @page { size: A4; margin: 18mm 16mm 20mm; }
  @page { @bottom-center { content: counter(page) " / " counter(pages); } }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans CJK KR",
      "Noto Sans KR", sans-serif;
    color: #20242d; background: #fffcf5; font-size: 10.5pt; line-height: 1.65;
  }
  h1, h2, h3 {
    font-family: "Batang", "Noto Serif CJK KR", "Noto Serif KR",
      "Nanum Myeongjo", serif;
    color: #182238;
  }
  .cover { text-align: center; padding-top: 60mm; page-break-after: always; }
  .cover .brand { letter-spacing: .3em; color: #b8924a; font-size: 12pt; }
  .cover h1 { font-size: 22pt; margin: 8mm 0 4mm; }
  .cover .who { font-size: 13pt; }
  .cover .kw { margin-top: 8mm; color: #5b4b78; }
  .gold { height: 1.5px; background: linear-gradient(90deg, transparent, #b8924a, transparent); margin: 6mm 0; }
  h2 { font-size: 14pt; border-bottom: 1.5px solid #b8924a; padding-bottom: 2mm; margin: 8mm 0 3mm; page-break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 4mm 0 1mm; page-break-after: avoid; }
  p { margin: 0 0 2mm; }
  .dim { color: #55585f; font-size: 9.5pt; }
  .section { page-break-inside: avoid; }
  .insight { page-break-inside: avoid; margin-bottom: 4mm; }
  .kv { display: flex; flex-wrap: wrap; gap: 2mm 6mm; font-size: 9.5pt; color: #40434b; }
  .kv span b { color: #182238; }
  .bar-row { display: flex; align-items: center; gap: 3mm; margin: 1.5mm 0; }
  .bar-label { width: 16mm; font-weight: 600; font-size: 9.5pt; }
  .bar-track { flex: 1; height: 3mm; background: #ece6d8; border-radius: 2mm; overflow: hidden; }
  .bar-fill { display: block; height: 100%; background: #5b4b78; border-radius: 2mm; }
  .bar-val { width: 22mm; text-align: right; font-size: 9pt; color: #686a73; }
  ul, ol { margin: 1mm 0 2mm; padding-left: 5mm; }
  .foot { margin-top: 8mm; font-size: 8.5pt; color: #686a73; }
</style></head>
<body>
  <!-- 표지 -->
  <section class="cover">
    <div class="brand">${esc(siteConfig.brand)} · 運談</div>
    <h1>사주 × 서양점성술<br>종합 리포트</h1>
    <div class="who">${esc(nickname)} 님</div>
    <div class="dim">생성일 ${esc(generatedAt)}</div>
    <div class="kw">${synthesis.keywords.map((k) => "#" + esc(k)).join("&nbsp;&nbsp;")}</div>
  </section>

  <!-- 계산 정보 -->
  <h2>계산 정보</h2>
  <div class="section">
    <div class="kv">
      <span><b>출생</b> ${g.year}.${g.month}.${g.day} ${chart.saju.meta.birthTimeKnown ? `${g.hour}:${String(g.minute).padStart(2, "0")}` : "시간 미상"}</span>
      <span><b>출생지</b> ${esc(cityLabel)}</span>
      <span><b>시간대</b> ${esc(a.meta.timezone)}</span>
      <span><b>정확도</b> ${chart.accuracy.grade}등급</span>
    </div>
    <div class="gold"></div>
    <div class="kv">
      <span><b>연주</b> ${s.pillars.year.stemKo}${s.pillars.year.branchKo}</span>
      <span><b>월주</b> ${s.pillars.month.stemKo}${s.pillars.month.branchKo}</span>
      <span><b>일주</b> ${s.pillars.day.stemKo}${s.pillars.day.branchKo}</span>
      <span><b>시주</b> ${s.pillars.hour ? s.pillars.hour.stemKo + s.pillars.hour.branchKo : "—"}</span>
      <span><b>일간</b> ${s.dayMasterKo}(${s.dayMaster})</span>
    </div>
    <div class="kv" style="margin-top:2mm">
      <span><b>태양</b> ${esc(sun?.signKo ?? "")}</span>
      <span><b>달</b> ${esc(moon?.signKo ?? "")}</span>
      <span><b>상승궁</b> ${a.ascendant ? esc(a.ascendant.signKo) : "미확정"}</span>
      <span><b>체계</b> ${a.meta.zodiac}/${a.meta.houseSystem}</span>
    </div>
  </div>

  <h2>핵심 요약</h2>
  <div class="section"><p>${esc(synthesis.summary)}</p></div>

  <h2>겉모습과 내면</h2>
  ${insights}

  <h2>사주 · 서양점성술 원소 분포</h2>
  <div class="section">
    <h3>사주 오행 분포</h3>${bars(sajuElements)}
    <h3 style="margin-top:4mm">점성술 원소 분포</h3>${bars(astroElements)}
  </div>

  <h2>두 체계의 공통점</h2>
  <div class="section">
    ${synthesis.convergences.map((c) => `<h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>`).join("")}
  </div>

  <h2>내적 긴장</h2>
  <div class="section">
    <h3>${esc(synthesis.tension.title)}</h3>
    <p>${esc(synthesis.tension.description)}</p>
    <p class="dim"><b>통합 조언</b> ${esc(synthesis.tension.integrationAdvice)}</p>
  </div>

  <h2>일과 돈</h2>
  <div class="section">
    <p>${esc(synthesis.workAndMoney.summary)}</p>
    <p class="dim"><b>잘 맞는 환경</b> ${synthesis.workAndMoney.goodEnvironment.map(esc).join(" / ")}</p>
    <p class="dim"><b>결정 방식</b> ${esc(synthesis.workAndMoney.decisionPattern)}</p>
    <p class="dim"><b>행동</b> ${esc(synthesis.workAndMoney.action)}</p>
  </div>

  <h2>연애와 인간관계</h2>
  <div class="section">
    <p>${esc(synthesis.relationships.summary)}</p>
    <p class="dim"><b>표현 방식</b> ${esc(synthesis.relationships.expressionStyle)}</p>
    <p class="dim"><b>갈등 패턴</b> ${esc(synthesis.relationships.conflictPattern)}</p>
    <p class="dim"><b>행동</b> ${esc(synthesis.relationships.action)}</p>
  </div>

  <h2>스트레스와 회복</h2>
  <div class="section">
    <p>${esc(synthesis.stressAndRecovery.summary)}</p>
    <p class="dim"><b>스트레스 패턴</b> ${esc(synthesis.stressAndRecovery.stressPattern)}</p>
    <ul>${synthesis.stressAndRecovery.recoverySuggestions.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
  </div>

  <h2>오늘부터 적용할 행동</h2>
  <div class="section">
    <ol>${synthesis.actions.map((x) => `<li>${esc(x.action)}</li>`).join("")}</ol>
  </div>

  <h2>해석 근거 · 한계</h2>
  <div class="section">
    <p class="dim">신뢰 수준: ${synthesis.confidence.level} — ${esc(synthesis.confidence.reason)}</p>
    <ul>${synthesis.limitations.map((l) => `<li class="dim">${esc(l)}</li>`).join("")}</ul>
    <div class="foot">
      ${esc(siteConfig.brand)} 리포트는 자기이해와 오락을 위한 참고 콘텐츠입니다. 미래를 보장하지 않으며
      의료·법률·투자·심리상담을 대체하지 않습니다. · ${esc(siteConfig.contactEmail)}
    </div>
  </div>
</body></html>`;
}

/** 안전한 파일명 생성 */
export function pdfFileName(brand: string, nickname: string, date: string): string {
  const safe = nickname.replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 20) || "리포트";
  return `${brand}_${safe}_종합리포트_${date}.pdf`;
}
