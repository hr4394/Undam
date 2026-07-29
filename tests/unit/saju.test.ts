import { describe, it, expect } from "vitest";
import { normalizeBirth } from "@/domain/normalize";
import { calculateSaju } from "@/domain/saju/calculator";
import { makeBirth } from "./fixtures";

const opts = { useTrueSolarTime: true, dayBoundary: "midnight" as const };
const optsNoTst = { useTrueSolarTime: false, dayBoundary: "midnight" as const };

describe("SajuCalculator", () => {
  it("1990-05-15 14:30 서울 원국을 절기 기준으로 계산한다", () => {
    const saju = calculateSaju(normalizeBirth(makeBirth()), optsNoTst);
    // 검증 fixture: 년 庚午 · 월 辛巳 · 일 庚辰 · 시 癸未
    expect(saju.pillars.year.stem + saju.pillars.year.branch).toBe("庚午");
    expect(saju.pillars.month.stem + saju.pillars.month.branch).toBe("辛巳");
    expect(saju.pillars.day.stem + saju.pillars.day.branch).toBe("庚辰");
    expect(saju.pillars.hour?.stem + "" + saju.pillars.hour?.branch).toBe("癸未");
    expect(saju.dayMaster).toBe("庚");
    expect(saju.dayMasterElement).toBe("metal");
  });

  it("진태양시 보정을 켜도 서울 未시 경계 안에서 시주가 유지된다", () => {
    const saju = calculateSaju(normalizeBirth(makeBirth()), opts);
    expect(saju.pillars.hour?.branch).toBe("未");
    expect(saju.meta.useTrueSolarTime).toBe(true);
  });

  it("출생 시간 미상이면 시주를 계산하지 않는다", () => {
    const saju = calculateSaju(
      normalizeBirth(makeBirth({ birthTimeUnknown: true, hour: null, minute: null })),
      opts,
    );
    expect(saju.pillars.hour).toBeNull();
    expect(saju.meta.birthTimeKnown).toBe(false);
    expect(saju.meta.warnings.join(" ")).toContain("시주");
  });

  it("월주는 절기 기준: 입춘 전후로 월지가 달라진다", () => {
    // 입춘은 대략 2월 4일. 2월 3일생은 丑(늦겨울), 2월 5일생은 寅(초봄)
    const before = calculateSaju(
      normalizeBirth(makeBirth({ year: 2000, month: 2, day: 3, hour: 10, minute: 0 })),
      optsNoTst,
    );
    const after = calculateSaju(
      normalizeBirth(makeBirth({ year: 2000, month: 2, day: 5, hour: 10, minute: 0 })),
      optsNoTst,
    );
    expect(before.pillars.month.branch).not.toBe(after.pillars.month.branch);
    expect(after.pillars.month.branch).toBe("寅");
  });

  it("오행 분포 합계는 천간+지지 개수와 같다", () => {
    const saju = calculateSaju(normalizeBirth(makeBirth()), optsNoTst);
    const sum = Object.values(saju.elementCounts).reduce((a, b) => a + b, 0);
    // 시간 있음 → 4천간 + 4지지 = 8
    expect(sum).toBe(8);
  });

  it("음력 입력을 양력으로 변환해 계산한다", () => {
    // 음력 1990-04-21 ≈ 양력 1990-05-15
    const lunar = calculateSaju(
      normalizeBirth(
        makeBirth({ calendar: "lunar", year: 1990, month: 4, day: 21, hour: 14, minute: 30 }),
      ),
      optsNoTst,
    );
    expect(lunar.pillars.day.stem + lunar.pillars.day.branch).toBe("庚辰");
  });

  it("십성이 한글로 매핑된다", () => {
    const saju = calculateSaju(normalizeBirth(makeBirth()), optsNoTst);
    const joined = saju.tenGods.join(",");
    expect(/[가-힣]/.test(joined)).toBe(true);
  });
});
