import type { AstroElement, AstroModality } from "@/domain/types";

export const SIGN_KO: Record<string, string> = {
  aries: "양자리", taurus: "황소자리", gemini: "쌍둥이자리", cancer: "게자리",
  leo: "사자자리", virgo: "처녀자리", libra: "천칭자리", scorpio: "전갈자리",
  sagittarius: "궁수자리", capricorn: "염소자리", aquarius: "물병자리", pisces: "물고기자리",
};

export const PLANET_KO: Record<string, string> = {
  sun: "태양", moon: "달", mercury: "수성", venus: "금성", mars: "화성",
  jupiter: "목성", saturn: "토성", uranus: "천왕성", neptune: "해왕성", pluto: "명왕성",
};

/** 리포트에 포함할 주요 천체(고전 10천체) */
export const CORE_PLANETS = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
] as const;

export const SIGN_ELEMENT: Record<string, AstroElement> = {
  aries: "fire", leo: "fire", sagittarius: "fire",
  taurus: "earth", virgo: "earth", capricorn: "earth",
  gemini: "air", libra: "air", aquarius: "air",
  cancer: "water", scorpio: "water", pisces: "water",
};

export const SIGN_MODALITY: Record<string, AstroModality> = {
  aries: "cardinal", cancer: "cardinal", libra: "cardinal", capricorn: "cardinal",
  taurus: "fixed", leo: "fixed", scorpio: "fixed", aquarius: "fixed",
  gemini: "mutable", virgo: "mutable", sagittarius: "mutable", pisces: "mutable",
};

export const ASPECT_KO: Record<string, string> = {
  conjunction: "합(0°)",
  opposition: "충(180°)",
  trine: "삼각(120°)",
  square: "사각(90°)",
  sextile: "육각(60°)",
};

export const ASTRO_ELEMENT_KO: Record<AstroElement, string> = {
  fire: "불", earth: "흙", air: "공기", water: "물",
};
export const ASTRO_MODALITY_KO: Record<AstroModality, string> = {
  cardinal: "활동", fixed: "고정", mutable: "변통",
};
