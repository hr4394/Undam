import type { FiveElement, YinYang } from "@/domain/types";

/** 천간 한자 → 한글 */
export const STEM_KO: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

/** 지지 한자 → 한글 */
export const BRANCH_KO: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

/** 천간 오행 */
export const STEM_ELEMENT: Record<string, FiveElement> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water",
};

/** 지지 오행(본기) */
export const BRANCH_ELEMENT: Record<string, FiveElement> = {
  寅: "wood", 卯: "wood", 巳: "fire", 午: "fire",
  辰: "earth", 戌: "earth", 丑: "earth", 未: "earth",
  申: "metal", 酉: "metal", 亥: "water", 子: "water",
};

/** 천간 음양 (양: 甲丙戊庚壬) */
export const STEM_YINYANG: Record<string, YinYang> = {
  甲: "yang", 丙: "yang", 戊: "yang", 庚: "yang", 壬: "yang",
  乙: "yin", 丁: "yin", 己: "yin", 辛: "yin", 癸: "yin",
};

/** 지지 음양 (양: 子寅辰午申戌) */
export const BRANCH_YINYANG: Record<string, YinYang> = {
  子: "yang", 寅: "yang", 辰: "yang", 午: "yang", 申: "yang", 戌: "yang",
  丑: "yin", 卯: "yin", 巳: "yin", 未: "yin", 酉: "yin", 亥: "yin",
};

/** 십성(十星) 간체자 → 한글 */
export const SHI_SHEN_KO: Record<string, string> = {
  比肩: "비견", 劫财: "겁재", 劫財: "겁재",
  食神: "식신", 伤官: "상관", 傷官: "상관",
  偏财: "편재", 偏財: "편재", 正财: "정재", 正財: "정재",
  七杀: "편관", 七殺: "편관", 偏官: "편관", 正官: "정관",
  偏印: "편인", 正印: "정인",
};

export function shiShenKo(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return SHI_SHEN_KO[raw] ?? raw;
}

/** 지지 → 계절 대략 (절기 기반 보조 표기) */
export const BRANCH_SEASON: Record<string, string> = {
  寅: "초봄", 卯: "봄", 辰: "늦봄",
  巳: "초여름", 午: "여름", 未: "늦여름",
  申: "초가을", 酉: "가을", 戌: "늦가을",
  亥: "초겨울", 子: "겨울", 丑: "늦겨울",
};
