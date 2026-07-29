import { describe, it, expect } from "vitest";
import { normalizeBirth } from "@/domain/normalize";
import { calculateAstrology } from "@/domain/astrology/calculator";
import { makeBirth } from "./fixtures";

describe("AstrologyCalculator", () => {
  it("1990-05-15 14:30 서울: 태양은 황소자리", () => {
    const astro = calculateAstrology(normalizeBirth(makeBirth()));
    const sun = astro.planets.find((p) => p.key === "sun");
    expect(sun?.sign).toBe("taurus");
  });

  it("주요 10천체를 모두 계산한다", () => {
    const astro = calculateAstrology(normalizeBirth(makeBirth()));
    expect(astro.planets).toHaveLength(10);
  });

  it("출생 시간이 있으면 상승궁과 하우스를 계산한다", () => {
    const astro = calculateAstrology(normalizeBirth(makeBirth()));
    expect(astro.ascendant).not.toBeNull();
    expect(astro.houses).toHaveLength(12);
    expect(astro.planets.every((p) => p.house !== null)).toBe(true);
  });

  it("출생 시간 미상이면 상승궁/하우스를 확정하지 않는다", () => {
    const astro = calculateAstrology(
      normalizeBirth(makeBirth({ birthTimeUnknown: true, hour: null, minute: null })),
    );
    expect(astro.ascendant).toBeNull();
    expect(astro.houses).toBeNull();
    expect(astro.planets.every((p) => p.house === null)).toBe(true);
    expect(astro.meta.warnings.length).toBeGreaterThan(0);
  });

  it("원소 분포 합계는 주요 천체 수(10)와 같다", () => {
    const astro = calculateAstrology(normalizeBirth(makeBirth()));
    const sum = Object.values(astro.elementCounts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(10);
  });

  it("메타데이터에 계산 정책이 기록된다", () => {
    const astro = calculateAstrology(normalizeBirth(makeBirth()));
    expect(astro.meta.zodiac).toBe("tropical");
    expect(astro.meta.houseSystem).toBe("placidus");
    expect(astro.meta.geocentric).toBe(true);
  });
});
