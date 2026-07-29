import type {
  AstroElement,
  AstrologyResult,
  FiveElement,
  SajuResult,
} from "@/domain/types";
import { FIVE_ELEMENT_LABELS } from "@/domain/types";
import { ASTRO_ELEMENT_KO } from "@/domain/astrology/tables";

/**
 * 계산 결과에서 해석에 유용한 신호를 도출한다.
 * 오행과 점성술 원소를 같은 개념으로 취급하지 않는다 — 각 체계 내부에서 먼저 요약하고
 * '행동 패턴' 수준에서만 비교한다.
 */
export interface DerivedSignals {
  saju: {
    dayMasterKo: string;
    dayMasterElementKo: string;
    dayMasterYinYang: "yin" | "yang";
    dominantElement: FiveElement;
    dominantElementKo: string;
    lackingElements: FiveElement[];
    lackingElementsKo: string[];
    yinYangBias: "yin" | "yang" | "balanced";
    tenGods: string[];
    season: string;
  };
  astro: {
    sunKo: string;
    moonKo: string;
    ascKo: string | null;
    dominantElement: AstroElement;
    dominantElementKo: string;
    dominantModalityKo: string;
    tightestAspects: { text: string; orb: number }[];
  };
  /** 행동 패턴 수준의 공통점 후보 */
  convergenceHints: string[];
  /** 상반되게 나타날 수 있는 긴장 후보 */
  tensionHints: string[];
}

function maxKey<K extends string>(counts: Record<K, number>): K {
  return (Object.keys(counts) as K[]).reduce((a, b) =>
    counts[b] > counts[a] ? b : a,
  );
}

const MODALITY_KO: Record<string, string> = {
  cardinal: "활동",
  fixed: "고정",
  mutable: "변통",
};

export function deriveSignals(
  saju: SajuResult,
  astro: AstrologyResult,
): DerivedSignals {
  const dominantElement = maxKey(saju.elementCounts);
  const lacking = (Object.keys(saju.elementCounts) as FiveElement[]).filter(
    (e) => saju.elementCounts[e] === 0,
  );
  const yinYangBias =
    saju.yinYangCounts.yin > saju.yinYangCounts.yang
      ? "yin"
      : saju.yinYangCounts.yang > saju.yinYangCounts.yin
        ? "yang"
        : "balanced";

  const sun = astro.planets.find((p) => p.key === "sun");
  const moon = astro.planets.find((p) => p.key === "moon");
  const astroDominant = maxKey(astro.elementCounts);
  const astroModality = maxKey(astro.modalityCounts);

  const tightestAspects = astro.aspects.slice(0, 3).map((a) => {
    const pa = astro.planets.find((p) => p.key === a.a)?.nameKo ?? a.a;
    const pb = astro.planets.find((p) => p.key === a.b)?.nameKo ?? a.b;
    return { text: `${pa}–${pb} ${a.typeKo}`, orb: a.orb };
  });

  // 행동 패턴 수준의 공통점/긴장 후보 (기계적 근거 → 문장은 AI/mock 이 다듬음)
  const convergenceHints: string[] = [];
  const tensionHints: string[] = [];

  // 활동/양(陽) 성향의 겹침
  if (yinYangBias === "yang" && astroModality === "cardinal") {
    convergenceHints.push(
      "두 체계 모두 스스로 상황을 먼저 움직이려는 능동성을 가리킵니다.",
    );
  }
  if (yinYangBias === "yin" && (astroDominant === "water" || astroModality === "fixed")) {
    convergenceHints.push(
      "두 체계 모두 안으로 정보를 모은 뒤 신중하게 움직이는 경향을 가리킵니다.",
    );
  }
  // 사주는 안정 지향인데 점성술은 변화 지향 → 긴장
  if (dominantElement === "earth" && astroModality === "mutable") {
    tensionHints.push(
      "사주는 안정과 지속을, 점성술은 유연한 변화를 선호하는 신호가 함께 나타납니다.",
    );
  }
  if (yinYangBias === "yang" && astroDominant === "water") {
    tensionHints.push(
      "겉으로 드러나는 추진력과 안으로 예민하게 반응하는 감정선 사이에 긴장이 있을 수 있습니다.",
    );
  }
  if (convergenceHints.length === 0) {
    convergenceHints.push(
      "두 체계는 서로 다른 언어를 쓰지만, 일상의 선택 방식에서 겹치는 지점이 있습니다.",
    );
  }
  if (tensionHints.length === 0) {
    tensionHints.push(
      "빠르게 시작하려는 마음과 완성도를 지키려는 마음이 함께 나타날 수 있습니다.",
    );
  }

  return {
    saju: {
      dayMasterKo: saju.dayMasterKo,
      dayMasterElementKo: FIVE_ELEMENT_LABELS[saju.dayMasterElement],
      dayMasterYinYang: saju.dayMasterYinYang,
      dominantElement,
      dominantElementKo: FIVE_ELEMENT_LABELS[dominantElement],
      lackingElements: lacking,
      lackingElementsKo: lacking.map((e) => FIVE_ELEMENT_LABELS[e]),
      yinYangBias,
      tenGods: saju.tenGods,
      season: saju.season,
    },
    astro: {
      sunKo: sun?.signKo ?? "",
      moonKo: moon?.signKo ?? "",
      ascKo: astro.ascendant?.signKo ?? null,
      dominantElement: astroDominant,
      dominantElementKo: ASTRO_ELEMENT_KO[astroDominant],
      dominantModalityKo: MODALITY_KO[astroModality],
      tightestAspects,
    },
    convergenceHints,
    tensionHints,
  };
}
