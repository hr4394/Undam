/**
 * 도메인 공통 타입.
 * 계산기(SajuCalculator, AstrologyCalculator)는 순수 함수로 동작하며 DB에 의존하지 않는다.
 */

export type CalendarType = "solar" | "lunar";
export type Gender = "male" | "female" | "unspecified";
export type ReportTone = "warm" | "analytic" | "concise";

export const INTEREST_AREAS = [
  "nature", // 타고난 성향
  "career", // 직업과 적성
  "money", // 돈을 다루는 방식
  "relationship", // 연애와 인간관계
  "stress", // 스트레스와 회복
  "concern", // 현재 고민
  "yearFlow", // 올해의 흐름
] as const;
export type InterestArea = (typeof INTEREST_AREAS)[number];

export const INTEREST_LABELS: Record<InterestArea, string> = {
  nature: "타고난 성향",
  career: "직업과 적성",
  money: "돈을 다루는 방식",
  relationship: "연애와 인간관계",
  stress: "스트레스와 회복",
  concern: "현재 고민",
  yearFlow: "올해의 흐름",
};

/** 사용자가 입력하는 원본 출생 정보 */
export interface BirthInput {
  nickname: string;
  gender: Gender;
  calendar: CalendarType;
  /** 음력일 때 윤달 여부 */
  isLeapMonth: boolean;
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  /** 출생 시간을 모르면 hour/minute 은 null */
  hour: number | null; // 0-23
  minute: number | null; // 0-59
  birthTimeUnknown: boolean;
  /** 출생지 */
  countryCode: string; // ISO-3166-1 alpha-2, 예: "KR"
  cityId: string; // 내부 도시 DB id
  interests: InterestArea[];
  concernText?: string;
  tone: ReportTone;
}

/** 정규화된 출생 데이터 (좌표/시간대 확정 후) */
export interface NormalizedBirth {
  /** 그레고리력(양력) 기준 확정 날짜/시간 */
  gregorian: {
    year: number;
    month: number;
    day: number;
    hour: number; // 시간 미상이면 정오(12)로 두되 birthTimeKnown=false
    minute: number;
  };
  birthTimeKnown: boolean;
  latitude: number;
  longitude: number;
  timezone: string; // IANA, 예: "Asia/Seoul"
  /** 표준시 대비 UTC offset(분) */
  utcOffsetMinutes: number;
  cityLabel: string; // "대한민국 · 서울"
  original: BirthInput;
}

export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export const FIVE_ELEMENT_LABELS: Record<FiveElement, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

export type YinYang = "yin" | "yang";

export interface Pillar {
  /** 천간 (한자) */
  stem: string;
  /** 지지 (한자) */
  branch: string;
  /** 천간 한글 */
  stemKo: string;
  /** 지지 한글 */
  branchKo: string;
  /** 지장간 (한자 배열) */
  hiddenStems: string[];
  /** 천간 오행 */
  stemElement: FiveElement;
  /** 천간 음양 */
  stemYinYang: YinYang;
  /** 십성 (일간 기준). 년/월/시주에 대해 계산, 일주는 '일간' */
  tenGod?: string;
}

export interface SajuResult {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null; // 시간 미상이면 null
  };
  /** 일간(한자) */
  dayMaster: string;
  dayMasterKo: string;
  dayMasterElement: FiveElement;
  dayMasterYinYang: YinYang;
  /** 오행 분포 (천간+지지 가중 카운트) */
  elementCounts: Record<FiveElement, number>;
  /** 음양 분포 */
  yinYangCounts: Record<YinYang, number>;
  /** 십성 요약 (있는 십성들) */
  tenGods: string[];
  /** 절기 기준 월 정보 */
  solarTerm: string;
  season: string;
  /** 안정적으로 계산 가능한 관계(합/충 등) 텍스트 */
  relations: string[];
  meta: {
    engine: string;
    engineVersion: string;
    useTrueSolarTime: boolean;
    dayBoundary: string;
    birthTimeKnown: boolean;
    warnings: string[];
  };
}

export interface PlanetPosition {
  key: string; // "sun","moon",...
  nameKo: string;
  sign: string; // 별자리 영문 key
  signKo: string;
  degree: number; // 별자리 내 도수 0-30
  longitude: number; // 황경 0-360
  house: number | null; // 시간 미상이면 null
  retrograde: boolean;
}

export type AstroElement = "fire" | "earth" | "air" | "water";
export type AstroModality = "cardinal" | "fixed" | "mutable";

export interface Aspect {
  a: string; // planet key
  b: string;
  type: string; // conjunction/opposition/trine/square/sextile
  typeKo: string;
  orb: number;
}

export interface AstrologyResult {
  planets: PlanetPosition[];
  ascendant: { sign: string; signKo: string; degree: number } | null;
  midheaven: { sign: string; signKo: string; degree: number } | null;
  houses: { house: number; sign: string; signKo: string; degree: number }[] | null;
  elementCounts: Record<AstroElement, number>;
  modalityCounts: Record<AstroModality, number>;
  aspects: Aspect[];
  /** 달이 당일 별자리를 넘어갈 가능성(시간 미상 시) */
  moonSignAmbiguous: boolean;
  moonAltSign?: { signKo: string } | null;
  meta: {
    engine: string;
    engineVersion: string;
    zodiac: "tropical";
    houseSystem: "placidus";
    geocentric: true;
    timezone: string;
    latitude: number;
    longitude: number;
    birthTimeKnown: boolean;
    warnings: string[];
  };
}

export type Confidence = "high" | "medium" | "limited";

/** 데이터 정확도 등급 (계산 신뢰도) */
export type AccuracyGrade = "A" | "B" | "C";
