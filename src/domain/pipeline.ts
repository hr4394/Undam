import type {
  AccuracyGrade,
  AstrologyResult,
  BirthInput,
  NormalizedBirth,
  SajuResult,
} from "@/domain/types";
import { normalizeBirth } from "@/domain/normalize";
import { calculateSaju } from "@/domain/saju/calculator";
import { calculateAstrology } from "@/domain/astrology/calculator";
import { accuracyGrade } from "@/domain/accuracy";
import { sajuPolicy } from "@/config/env";
import { FIVE_ELEMENT_LABELS } from "@/domain/types";
import { ASTRO_ELEMENT_KO } from "@/domain/astrology/tables";

/** 계산 결과 묶음 (AI 해석 이전 단계, DB 비의존) */
export interface ChartResult {
  normalized: NormalizedBirth;
  saju: SajuResult;
  astrology: AstrologyResult;
  accuracy: { grade: AccuracyGrade; reasons: string[] };
}

/** 출생 입력 → 계산(사주+점성술). AI 없음. */
export function computeChart(input: BirthInput): ChartResult {
  const normalized = normalizeBirth(input);
  const saju = calculateSaju(normalized, {
    useTrueSolarTime: sajuPolicy.useTrueSolarTime,
    dayBoundary: sajuPolicy.dayBoundary,
  });
  const astrology = calculateAstrology(normalized);
  const accuracy = accuracyGrade(saju, astrology);
  return { normalized, saju, astrology, accuracy };
}

/** 무료 미리보기 데이터 (결제 전 노출) */
export interface FreePreview {
  sajuKeyword: string;
  astrologyKeyword: string;
  commonSentence: string;
  elementCounts: Record<string, number>;
  astroElementCounts: Record<string, number>;
  accuracyGrade: AccuracyGrade;
  accuracyReasons: string[];
  /** 유료 리포트 목차 */
  tableOfContents: string[];
  /** 유료 결과 일부 미리보기 */
  teaser: string;
}

export function buildFreePreview(chart: ChartResult): FreePreview {
  const { saju, astrology, accuracy } = chart;
  const dominant = (Object.keys(saju.elementCounts) as (keyof typeof saju.elementCounts)[]).reduce(
    (a, b) => (saju.elementCounts[b] > saju.elementCounts[a] ? b : a),
  );
  const sun = astrology.planets.find((p) => p.key === "sun");
  const astroDominant = (Object.keys(astrology.elementCounts) as (keyof typeof astrology.elementCounts)[]).reduce(
    (a, b) => (astrology.elementCounts[b] > astrology.elementCounts[a] ? b : a),
  );

  const elementLabelCounts: Record<string, number> = {};
  for (const [k, v] of Object.entries(saju.elementCounts)) {
    elementLabelCounts[FIVE_ELEMENT_LABELS[k as keyof typeof FIVE_ELEMENT_LABELS]] = v;
  }
  const astroLabelCounts: Record<string, number> = {};
  for (const [k, v] of Object.entries(astrology.elementCounts)) {
    astroLabelCounts[ASTRO_ELEMENT_KO[k as keyof typeof ASTRO_ELEMENT_KO]] = v;
  }

  return {
    sajuKeyword: `${FIVE_ELEMENT_LABELS[dominant]} 기운`,
    astrologyKeyword: `${sun?.signKo ?? ""} 태양 · ${ASTRO_ELEMENT_KO[astroDominant]} 원소`,
    commonSentence:
      "두 체계 모두, 겉으로 보이는 태도와 실제로 편안해지는 방식 사이의 리듬 차이를 가리킵니다.",
    elementCounts: elementLabelCounts,
    astroElementCounts: astroLabelCounts,
    accuracyGrade: accuracy.grade,
    accuracyReasons: accuracy.reasons,
    tableOfContents: [
      "20초 핵심 요약",
      "핵심 키워드 3개",
      "겉모습과 내면",
      "사주에서 본 나",
      "서양점성술에서 본 나",
      "두 체계의 공통점",
      "두 체계의 내적 긴장",
      "일과 돈",
      "연애와 인간관계",
      "스트레스와 회복",
      "오늘부터의 행동 3가지",
      "해석 근거 · 정확도와 한계",
    ],
    teaser:
      "전체 리포트에서는 위 신호가 일상에서 어떤 행동 패턴으로 나타나는지, 그리고 오늘부터 적용할 구체적인 행동까지 이어서 확인할 수 있습니다.",
  };
}
