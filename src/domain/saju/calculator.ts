import { Solar } from "lunar-typescript";
import type {
  FiveElement,
  NormalizedBirth,
  Pillar,
  SajuResult,
  YinYang,
} from "@/domain/types";
import {
  BRANCH_ELEMENT,
  BRANCH_KO,
  BRANCH_SEASON,
  BRANCH_YINYANG,
  STEM_ELEMENT,
  STEM_KO,
  STEM_YINYANG,
  shiShenKo,
} from "./tables";

/**
 * SajuCalculator
 * 검증된 lunar-typescript(6tail lunar) 엔진을 사용해 절기 기준 사주 원국을 계산한다.
 * - 월주는 음력 월이 아니라 절기(節氣) 기준으로 계산됨(엔진 보장).
 * - 진태양시(경도 기반 평균태양시) 보정은 정책에 따라 시간에 적용.
 * - 출생 시간 미상이면 시주를 확정하지 않는다.
 *
 * AI 는 계산기가 아니라 해석기다. 여기서 만든 구조화 데이터만 해석에 넘긴다.
 */

const ENGINE = "lunar-typescript";
// package.json 의존성 버전과 일치시켜 기록(계산 재현성용).
const ENGINE_VERSION = "1.7.x";

export interface SajuOptions {
  useTrueSolarTime: boolean;
  dayBoundary: "midnight" | "early-zi";
}

function trueSolarCorrectionMinutes(
  longitude: number,
  utcOffsetMinutes: number,
): number {
  // 표준시 자오선 경도 = offset(시간) * 15
  const standardMeridian = (utcOffsetMinutes / 60) * 15;
  // 경도 1도당 4분. 동쪽으로 갈수록 태양시가 빠르다.
  return (longitude - standardMeridian) * 4;
}

function buildPillar(
  stem: string,
  branch: string,
  hiddenStems: string[],
  tenGod: string | undefined,
): Pillar {
  return {
    stem,
    branch,
    stemKo: STEM_KO[stem] ?? stem,
    branchKo: BRANCH_KO[branch] ?? branch,
    hiddenStems,
    stemElement: STEM_ELEMENT[stem],
    stemYinYang: STEM_YINYANG[stem],
    tenGod: tenGod === "일간(日干)" ? tenGod : shiShenKo(tenGod),
  };
}

export function calculateSaju(
  birth: NormalizedBirth,
  options: SajuOptions,
): SajuResult {
  const warnings: string[] = [];
  const { gregorian, birthTimeKnown } = birth;

  // 진태양시 보정: 정책이 켜져 있고 시간을 알 때만 적용.
  let { hour, minute } = gregorian;
  if (options.useTrueSolarTime && birthTimeKnown) {
    const corr = trueSolarCorrectionMinutes(
      birth.longitude,
      birth.utcOffsetMinutes,
    );
    const total = hour * 60 + minute + corr;
    const clamped = ((total % 1440) + 1440) % 1440;
    hour = Math.floor(clamped / 60);
    minute = Math.round(clamped % 60);
  }

  // 시간 미상이면 정오로 계산하되 시주는 버린다.
  const solar = Solar.fromYmdHms(
    gregorian.year,
    gregorian.month,
    gregorian.day,
    birthTimeKnown ? hour : 12,
    birthTimeKnown ? minute : 0,
    0,
  );
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  // 일 경계 정책: early-zi 는 23시 이후를 다음날 일주로 보는 유파.
  // 엔진 기본은 자시(23~01)를 당일로 처리. 정책이 early-zi 면 경고만 남기고
  // 엔진 값을 그대로 사용(추가 검증 없는 임의 변경을 피함).
  if (options.dayBoundary === "early-zi" && birthTimeKnown && hour >= 23) {
    warnings.push(
      "자시(23시 이후) 일주 경계는 유파에 따라 달라질 수 있어 엔진 기본값을 사용했습니다.",
    );
  }

  const yearP = buildPillar(
    ec.getYearGan(),
    ec.getYearZhi(),
    ec.getYearHideGan(),
    ec.getYearShiShenGan(),
  );
  const monthP = buildPillar(
    ec.getMonthGan(),
    ec.getMonthZhi(),
    ec.getMonthHideGan(),
    ec.getMonthShiShenGan(),
  );
  const dayP = buildPillar(
    ec.getDayGan(),
    ec.getDayZhi(),
    ec.getDayHideGan(),
    "일간(日干)",
  );
  const hourP: Pillar | null = birthTimeKnown
    ? buildPillar(
        ec.getTimeGan(),
        ec.getTimeZhi(),
        ec.getTimeHideGan(),
        ec.getTimeShiShenGan(),
      )
    : null;

  if (!birthTimeKnown) {
    warnings.push("출생 시간을 몰라 시주를 계산하지 않았습니다. 시주 기반 해석은 제외됩니다.");
  }

  // 오행 분포: 4천간 + 4지지(본기) 카운트.
  const elementCounts: Record<FiveElement, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  const yinYangCounts: Record<YinYang, number> = { yin: 0, yang: 0 };

  const stems = [yearP.stem, monthP.stem, dayP.stem];
  const branches = [yearP.branch, monthP.branch, dayP.branch];
  if (hourP) {
    stems.push(hourP.stem);
    branches.push(hourP.branch);
  }
  for (const s of stems) {
    elementCounts[STEM_ELEMENT[s]] += 1;
    yinYangCounts[STEM_YINYANG[s]] += 1;
  }
  for (const b of branches) {
    elementCounts[BRANCH_ELEMENT[b]] += 1;
    yinYangCounts[BRANCH_YINYANG[b]] += 1;
  }

  const tenGods = [
    yearP.tenGod,
    monthP.tenGod,
    hourP?.tenGod,
  ].filter((t): t is string => Boolean(t) && t !== "일간(日干)");

  // 안정적으로 계산 가능한 관계: 엔진이 제공하는 정보 위주.
  const relations: string[] = [];
  const prevJie = lunar.getPrevJieQi(true);
  const solarTerm = prevJie ? prevJie.getName() : "";
  const season = BRANCH_SEASON[monthP.branch] ?? "";

  return {
    pillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
    dayMaster: dayP.stem,
    dayMasterKo: dayP.stemKo,
    dayMasterElement: STEM_ELEMENT[dayP.stem],
    dayMasterYinYang: STEM_YINYANG[dayP.stem],
    elementCounts,
    yinYangCounts,
    tenGods,
    solarTerm,
    season,
    relations,
    meta: {
      engine: ENGINE,
      engineVersion: ENGINE_VERSION,
      useTrueSolarTime: options.useTrueSolarTime && birthTimeKnown,
      dayBoundary: options.dayBoundary,
      birthTimeKnown,
      warnings,
    },
  };
}
