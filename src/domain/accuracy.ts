import type {
  AccuracyGrade,
  AstrologyResult,
  SajuResult,
} from "@/domain/types";

/**
 * 데이터 정확도 등급.
 * A: 출생 시간 확정 + 경고 없음
 * B: 출생 시간 확정이나 경고 있음, 또는 시간 미상이지만 핵심 요소 확보
 * C: 출생 시간 미상으로 시간 민감 항목(시주/상승궁/하우스) 제외
 */
export function accuracyGrade(
  saju: SajuResult,
  astro: AstrologyResult,
): { grade: AccuracyGrade; reasons: string[] } {
  const reasons: string[] = [];
  if (!saju.meta.birthTimeKnown) {
    reasons.push("출생 시간 미상 — 시주·상승궁·하우스 제외");
    if (astro.moonSignAmbiguous)
      reasons.push("달 별자리가 인접 별자리일 가능성");
    return { grade: "C", reasons };
  }
  const warns = saju.meta.warnings.length + astro.meta.warnings.length;
  if (warns > 0) {
    reasons.push("일부 계산 경고 존재");
    return { grade: "B", reasons };
  }
  reasons.push("출생 시간 확정 — 전체 요소 사용");
  return { grade: "A", reasons };
}

export const ACCURACY_LABEL: Record<AccuracyGrade, string> = {
  A: "정확도 높음",
  B: "정확도 보통",
  C: "정확도 제한(출생 시간 미상)",
};
