import type { Synthesis } from "./schema";
import { synthesisSchema } from "./schema";
import { deriveSignals, type DerivedSignals } from "./derive";
import {
  overallConfidence,
  type SynthesisInput,
  type SynthesisProvider,
  type SynthesisResult,
} from "./provider";
import type { FiveElement } from "@/domain/types";

/**
 * MockSynthesisProvider
 * API 키 없이 전체 흐름을 돌리기 위한 제공자(무료 배포의 기본 해석기).
 * 무작위 문장이 아니라 실제 계산 결과에서 신호를 뽑아 결정론적으로,
 * 그리고 "일반인도 바로 알아듣는 쉬운 말"로 길고 풍성하게 리포트를 구성한다.
 */

// 오행(다섯 기운)을 쉬운 말로.
const ELEMENT_PLAIN: Record<FiveElement, { name: string; vibe: string; strong: string; weak: string }> = {
  wood: {
    name: "나무",
    vibe: "위로 자라나려는 기운이에요. 새로운 걸 시작하고, 계획을 세우고, 앞으로 뻗어나가려는 성향과 이어져요.",
    strong: "하고 싶은 게 생기면 방향을 잡고 밀어붙이는 추진력",
    weak: "시작은 잘하는데 마무리나 유연함이 부족해질 때",
  },
  fire: {
    name: "불",
    vibe: "밝게 타오르는 기운이에요. 표현하고, 사람들 앞에 나서고, 순간적으로 확 반응하는 열정과 이어져요.",
    strong: "분위기를 밝히고 사람을 끌어당기는 표현력과 열정",
    weak: "감정이 확 올라왔다 금방 지치는 기복",
  },
  earth: {
    name: "흙",
    vibe: "가운데서 중심을 잡는 기운이에요. 꾸준함, 신뢰, 주변을 챙기는 안정감과 이어져요.",
    strong: "믿고 맡길 수 있는 꾸준함과 주변을 돌보는 마음",
    weak: "변화를 미루거나 혼자 다 떠안아 무거워질 때",
  },
  metal: {
    name: "쇠",
    vibe: "단단하게 다듬는 기운이에요. 원칙, 결단, 정리하고 매듭짓는 힘과 이어져요.",
    strong: "기준이 분명하고 필요할 때 딱 잘라 정리하는 결단력",
    weak: "기준이 너무 엄격해져 스스로도 남도 힘들게 할 때",
  },
  water: {
    name: "물",
    vibe: "낮은 곳으로 스미며 흐르는 기운이에요. 깊은 생각, 관찰, 상황에 맞춰 유연하게 움직이는 성향과 이어져요.",
    strong: "상황을 깊이 읽고 유연하게 흐르는 이해심과 통찰",
    weak: "생각이 많아 결정을 미루거나 속을 잘 안 보일 때",
  },
};

const ASTRO_ELEMENT_PLAIN: Record<string, string> = {
  불: "활력과 직진",
  흙: "현실 감각과 꾸준함",
  공기: "생각과 소통",
  물: "감정과 공감",
};

export class MockSynthesisProvider implements SynthesisProvider {
  readonly name = "mock";

  async generate(input: SynthesisInput): Promise<SynthesisResult> {
    const start = Date.now();
    const s = deriveSignals(input.saju, input.astrology);
    const level = overallConfidence(input);
    const tone = input.birth.tone;
    const el = ELEMENT_PLAIN[s.saju.dominantElement];
    const nick = input.birth.nickname;

    const toneClose =
      tone === "warm"
        ? "너무 애쓰지 말고, 오늘은 이 중 하나만 마음에 담아둬도 충분해요."
        : tone === "concise"
          ? "핵심만 짚었으니, 필요한 부분만 골라 써도 좋아요."
          : "각 항목은 계산 근거가 있는 관찰이니, 자신에게 맞는지 비교해 보세요.";

    const yinYangPlain =
      s.saju.yinYangBias === "yang"
        ? "밖으로 먼저 움직이고 부딪히며 배우는 편(양의 기운이 강함)"
        : s.saju.yinYangBias === "yin"
          ? "안에서 충분히 생각한 뒤 조용히 움직이는 편(음의 기운이 강함)"
          : "상황에 따라 나서기도 하고 물러서기도 하는 균형형";

    const synthesis: Synthesis = {
      headline: `${el.name}의 기운을 지닌 ${s.astro.sunKo}, 겉과 속이 다른 리듬을 가진 사람`,
      summary: buildSummary(s, el, nick, yinYangPlain, toneClose),
      lifeStory: buildLifeStory(s, el, nick),
      keywords: buildKeywords(s),
      confidence: { level, reason: buildConfidenceReason(input, level) },
      coreInsights: buildCoreInsights(s, el, level),
      workAndMoney: buildWorkAndMoney(s, el),
      relationships: buildRelationships(s),
      stressAndRecovery: buildStress(s, el),
      convergences: buildConvergences(s),
      tension: buildTension(s),
      actions: buildActions(s),
      limitations: buildLimitations(input),
    };

    const parsed = synthesisSchema.parse(synthesis);
    return {
      synthesis: parsed,
      usage: {
        provider: "mock",
        model: "mock-deterministic",
        inputTokens: 0,
        outputTokens: 0,
        costKrw: 0,
        latencyMs: Date.now() - start,
      },
    };
  }
}

function buildSummary(
  s: DerivedSignals,
  el: (typeof ELEMENT_PLAIN)[FiveElement],
  nick: string,
  yinYangPlain: string,
  toneClose: string,
): string {
  const astroPlain = ASTRO_ELEMENT_PLAIN[s.astro.dominantElementKo] ?? s.astro.dominantElementKo;
  return (
    `${nick}님을 두 가지 지도로 함께 읽어봤어요. 먼저 동양의 사주에서는, 태어난 날을 대표하는 기운(이걸 '일간'이라고 해요)이 ${s.saju.dayMasterKo}이고, 전체적으로 '${el.name}'의 기운이 가장 두드러졌어요. ${el.vibe} 성격의 흐름으로 보면 ${yinYangPlain}으로 나타납니다. ` +
    `한편 서양 별자리로 보면, 흔히 아는 생일 별자리(태양)는 ${s.astro.sunKo}, 마음이 편안해지는 방식을 보여주는 별자리(달)는 ${s.astro.moonKo}${s.astro.ascKo ? `, 남에게 처음 비치는 인상(상승궁)은 ${s.astro.ascKo}` : ""}예요. 여기서는 '${astroPlain}'의 색이 강하게 묻어납니다. ` +
    `두 지도는 서로 다른 언어를 쓰지만, 공통적으로 "겉으로 보이는 모습과 실제로 편안해지는 방식이 조금 다르다"는 점을 가리켜요. ${toneClose}`
  );
}

function buildLifeStory(
  s: DerivedSignals,
  el: (typeof ELEMENT_PLAIN)[FiveElement],
  nick: string,
): { title: string; narrative: string } {
  const childhood =
    s.saju.yinYangBias === "yin"
      ? "어릴 적엔 나서기보다 한발 물러서서 주변을 관찰하는 아이였을 가능성이 커요. 조용해 보였지만 속으로는 나름의 기준을 세우고 있었을 거예요."
      : "어릴 적엔 궁금한 게 생기면 먼저 부딪혀보는 편이었을 가능성이 커요. 에너지가 밖으로 향해서, 가만히 있기보다 뭔가를 벌이곤 했을 거예요.";
  const youth =
    s.astro.dominantModalityKo === "활동"
      ? "청년기를 지나며 '일단 시작하고 부딪히며 배우는' 방식이 몸에 뱄고, 그 과정에서 몇 번의 시행착오가 오히려 나만의 감각으로 남았을 거예요."
      : s.astro.dominantModalityKo === "고정"
        ? "청년기를 지나며 한번 마음먹은 건 끝까지 붙드는 끈기가 단단해졌고, 그만큼 방향을 바꾸는 일에는 신중해졌을 거예요."
        : "청년기를 지나며 상황에 맞춰 유연하게 방향을 바꾸는 법을 익혔고, 덕분에 다양한 자리에 잘 적응해왔을 거예요.";
  const now =
    `지금의 ${nick}님은, ${el.name}의 기운(${el.strong})을 어느 정도 자기 것으로 다룰 줄 아는 시기에 있는 것으로 보여요. ` +
    `다만 여전히 겉으로 보이는 모습과 속으로 편안한 방식 사이에서 리듬을 맞추는 중이고, 이 조율이 자연스러워질수록 관계도 일도 한결 가벼워질 거예요.`;
  return {
    title: "살아온 삶의 흐름",
    narrative: `${childhood} ${youth} ${now}`,
  };
}

function buildKeywords(s: DerivedSignals): [string, string, string] {
  const a =
    s.saju.yinYangBias === "yang" ? "먼저 움직이는 사람" : s.saju.yinYangBias === "yin" ? "깊이 생각하는 사람" : "균형을 찾는 사람";
  const b = ELEMENT_PLAIN[s.saju.dominantElement].name + "의 기운";
  const c = s.astro.dominantModalityKo === "활동" ? "새로 시작하는 힘" : s.astro.dominantModalityKo === "고정" ? "끝까지 밀고 가는 힘" : "상황에 맞추는 힘";
  return [a, b, c];
}

function buildConfidenceReason(input: SynthesisInput, level: string): string {
  if (level === "limited")
    return "태어난 시간을 몰라서, 시간이 꼭 필요한 부분(사주의 '시주', 별자리의 '상승궁'과 '하우스')은 빼고 해석했어요. 그래서 이 리포트는 '시간과 무관하게 말할 수 있는 부분' 위주예요. 태어난 시간을 알게 되면 훨씬 정확해집니다.";
  if (level === "medium")
    return "계산 과정에서 몇 가지 참고할 점이 있어, 시간에 민감한 부분은 조금 조심해서 읽는 게 좋아요.";
  return "태어난 시간까지 확인돼서, 사주 원국과 별자리 차트를 모두 사용해 해석했어요. 비교적 촘촘하게 볼 수 있는 경우예요.";
}

function buildCoreInsights(
  s: DerivedSignals,
  el: (typeof ELEMENT_PLAIN)[FiveElement],
  level: "high" | "medium" | "limited",
): Synthesis["coreInsights"] {
  const insights: Synthesis["coreInsights"] = [];

  // 1. 겉과 속의 리듬 차이
  insights.push({
    title: "처음 보이는 모습과, 진짜 편안해지는 모습이 달라요",
    insight:
      `${s.astro.ascKo ? `사람들은 ${s.astro.ascKo}처럼 보이는 첫인상으로 ${el.name}님을 먼저 만나요. 하지만 ` : "겉으로 드러나는 태도와 "}` +
      `마음이 실제로 안정되는 방식(별자리의 '달'이 ${s.astro.moonKo}인 것과 이어져요)은 그와 조금 달라요. 쉽게 말하면, "처음엔 이런 사람인가 보다" 싶다가도 시간이 지나면 "생각보다 다른 면이 있네" 하는 이야기를 듣는 유형이에요. ` +
      `사주에서도 ${s.saju.dayMasterKo}(${el.name}의 기운)이 겉으로는 ${s.saju.yinYangBias === "yang" ? "적극적이고 나서는 것처럼" : "차분하고 무던한 것처럼"} 보이게 하지만, 정작 마음이 놓이는 순간은 그와 다를 수 있다는 걸 함께 보여줘요.`,
    sajuEvidence: [
      `일간(태어난 날의 대표 기운): ${s.saju.dayMasterKo} — ${el.name}`,
      `기운의 방향: ${s.saju.yinYangBias === "yang" ? "밖으로 향함(양)" : s.saju.yinYangBias === "yin" ? "안으로 향함(음)" : "균형"}`,
    ],
    astrologyEvidence: [
      `태양(정체성) ${s.astro.sunKo} / 달(감정) ${s.astro.moonKo}`,
      s.astro.ascKo ? `상승궁(첫인상) ${s.astro.ascKo}` : "상승궁은 태어난 시간이 있어야 확인돼요",
    ],
    realLifePattern:
      "처음 만난 자리에서는 무난하게 잘 어울리지만, 정말 마음을 여는 데까지는 시간이 필요한 편이에요. 그래서 오래된 친구와 새 지인을 대하는 온도가 꽤 다를 수 있어요.",
    strength: "상황에 맞게 겉모습을 조절할 수 있어서, 낯선 자리에서도 크게 튀지 않고 잘 스며들어요.",
    caution: "겉과 속의 간격이 너무 벌어지면, 남들은 다 편해 보이는데 정작 본인만 속으로 지치는 일이 생길 수 있어요.",
    action: "가까워지고 싶은 사람에게는, 첫인상과 다른 진짜 모습을 한두 가지 슬쩍 알려주세요. '나 사실 낯을 좀 가려' 같은 한마디가 관계를 훨씬 편하게 만들어요.",
    confidence: level,
  });

  // 2. 가장 강한 기운의 사용법
  insights.push({
    title: `가장 강한 '${el.name}'의 기운, 잘 쓰면 무기 과하면 짐`,
    insight:
      `사주를 보면 다섯 가지 기운(나무·불·흙·쇠·물, 이걸 '오행'이라고 해요) 중에서 '${el.name}'의 기운이 가장 도드라져요. ${el.vibe} ` +
      `이 기운이 잘 발휘될 때는 ${el.strong}으로 나타나요. 반대로 같은 기운도 지나치면 ${el.weak} 모습으로 튀어나올 수 있어요. 장점과 약점이 사실은 '같은 성향의 앞뒷면'이라는 게 핵심이에요. ` +
      (s.saju.lackingElementsKo.length
        ? `한편 '${s.saju.lackingElementsKo.join("·")}'의 기운은 상대적으로 약하게 나왔어요. 이 영역(예: 마무리·표현·휴식·정리 등)은 타고나기보다 '의식적으로 챙기면' 훨씬 편해지는 부분이에요.`
        : `다섯 기운이 비교적 고르게 퍼져 있어서, 한쪽으로 크게 치우치지 않고 균형을 잡는 편이에요.`),
    sajuEvidence: [
      `가장 강한 기운: ${el.name}`,
      s.saju.lackingElementsKo.length ? `상대적으로 약한 기운: ${s.saju.lackingElementsKo.join("·")}` : "오행이 비교적 균형",
    ],
    astrologyEvidence: [
      `별자리 원소도 '${s.astro.dominantElementKo}'(${ASTRO_ELEMENT_PLAIN[s.astro.dominantElementKo] ?? ""})가 강조돼 결이 겹쳐요`,
      `일 처리 방식은 '${s.astro.dominantModalityKo}'형`,
    ],
    realLifePattern:
      "평소엔 이 강한 기운이 '나다움'으로 잘 쓰이지만, 스트레스를 받거나 여유가 없을 때는 똑같은 성향이 오히려 나를 피곤하게 만드는 방향으로 튀어나와요.",
    strength: `${el.strong} — 이게 필요한 상황에서 안정적으로 힘을 냅니다.`,
    caution: `잘하는 방식만 반복하다 보면, 약한 영역이 더 약해지는 악순환이 생길 수 있어요.`,
    action: s.saju.lackingElementsKo.length
      ? `일주일에 한 번은 약한 기운(${s.saju.lackingElementsKo[0]})과 연결된 행동을 일부러 넣어보세요. 예를 들어 쉼표 찍기, 감정 표현하기, 서류 정리하기처럼 평소 미루던 것 하나면 돼요.`
      : `이미 균형이 좋은 편이니, 잘 굴러가는 나만의 루틴을 메모해두고 힘들 때 그대로 재현하세요.`,
    confidence: level,
  });

  // 3. 애스펙트(행성 간 각도) 기반 — 있으면 추가
  if (s.astro.tightestAspects.length > 0) {
    const asp = s.astro.tightestAspects[0];
    insights.push({
      title: "마음속 두 가지 힘이 자주 부딪히거나 손잡는 지점",
      insight:
        `별자리에서 행성들이 이루는 각도(이걸 '애스펙트'라고 해요 — 두 성향이 서로 당기거나 미는 관계예요) 중에서 '${asp.text}'가 가장 뚜렷하게 나왔어요. ` +
        `이건 서로 다른 두 욕구가 자주 한 자리에서 만난다는 뜻이에요. 어떤 날은 이 조합이 강한 추진력이 되고, 어떤 날은 마음속에서 밀당하는 갈등처럼 느껴질 수 있어요. ` +
        `같은 에너지가 상황에 따라 '동력'도 되고 '피로'도 되는 셈이라, 이걸 미리 알아두면 스스로를 훨씬 덜 몰아세우게 돼요.`,
      sajuEvidence: [`일간 ${s.saju.dayMasterKo} 기준으로 본 전체 성향과도 결이 맞아요`],
      astrologyEvidence: s.astro.tightestAspects.map((a) => `${a.text} (오차 ${a.orb.toFixed(1)}°)`),
      realLifePattern:
        "중요한 선택 앞에서 마음이 두 갈래로 나뉘어, 결정을 내린 뒤에도 '이게 맞았나' 하고 되돌아보는 패턴이 나타날 수 있어요.",
      strength: "서로 다른 관점을 동시에 놓고 볼 수 있어서, 한쪽으로만 치우치지 않는 균형 감각이 있어요.",
      caution: "두 마음 사이에서 결정을 자꾸 미루면, 정작 기회를 놓치거나 스스로를 답답해할 수 있어요.",
      action: "결정이 어려울 땐, 두 선택지의 '최악의 경우'를 각각 딱 한 줄로 적어보세요. 머릿속에서만 돌리던 걸 글로 꺼내면 의외로 답이 빨리 보여요.",
      confidence: level,
    });
  }

  // 4. 사람들이 자주 오해하는 지점
  insights.push({
    title: "사람들이 자주 오해하지만, 사실은 이런 사람",
    insight:
      `${s.saju.yinYangBias === "yin" ? "조용하고 무던해 보여서 '순한 사람'으로만 여겨지기 쉽지만, 속에는 분명한 기준과 고집이 있어요. " : s.saju.yinYangBias === "yang" ? "적극적이고 시원시원해 보여서 '다 괜찮은 사람'으로 여겨지기 쉽지만, 속으로는 은근히 예민하게 재고 있는 부분이 있어요. " : "겉으로는 무던해 보이지만, 상황마다 나서고 물러서는 기준이 꽤 분명해요. "}` +
      `두 지도 모두, '보이는 모습 = 전부'가 아니라는 걸 반복해서 가리켜요. 그래서 나를 잘 모르는 사람은 겉모습만 보고 판단하기 쉽고, 정작 그게 오해의 출발점이 되곤 해요.`,
    sajuEvidence: [`기운의 방향(${s.saju.yinYangBias === "yang" ? "양" : s.saju.yinYangBias === "yin" ? "음" : "균형"})과 ${el.name} 기운의 조합`],
    astrologyEvidence: [`태양(${s.astro.sunKo})과 달(${s.astro.moonKo})이 서로 다른 결을 보여줘요`],
    realLifePattern:
      "'생각보다 단단하네' 또는 '생각보다 여리네' 같은 상반된 평을 동시에 듣는 편이에요. 둘 다 맞아요 — 상황에 따라 다른 면이 나오는 것뿐이에요.",
    strength: "겉과 속을 모두 가진 덕분에, 사람과 상황을 다층적으로 이해하는 힘이 있어요.",
    caution: "'남들이 나를 오해한다'는 느낌이 쌓이면 관계에서 먼저 벽을 칠 수 있어요.",
    action: "오해가 생길 것 같은 관계일수록, 설명을 미루지 말고 짧게라도 내 생각을 먼저 꺼내보세요.",
    confidence: level,
  });

  return insights.slice(0, 4);
}

function buildWorkAndMoney(
  s: DerivedSignals,
  el: (typeof ELEMENT_PLAIN)[FiveElement],
): Synthesis["workAndMoney"] {
  const startStyle =
    s.astro.dominantModalityKo === "활동"
      ? "일단 시작하고 굴러가면서 다듬는"
      : s.astro.dominantModalityKo === "고정"
        ? "제대로 준비해서 한번 정하면 끝까지 밀고 가는"
        : "상황을 보며 유연하게 방향을 바꾸는";
  return {
    summary:
      `일과 돈을 대하는 방식에는 '${el.name}'의 기운과 '${s.astro.dominantModalityKo}'형 성향이 함께 묻어나요. 정리하면, ${startStyle} 흐름으로 일을 대하는 편이에요. ` +
      `${s.saju.dominantElement === "earth" || s.saju.dominantElement === "metal" ? "안정과 신뢰가 성과로 인정받는 자리에서 특히 힘을 내요. 눈에 보이는 결과가 쌓이는 걸 좋아하거든요. " : s.saju.dominantElement === "wood" || s.saju.dominantElement === "fire" ? "새로운 걸 시도하고 반응이 빨리 오는 자리에서 특히 신이 나요. 정체되는 걸 답답해하는 편이에요. " : "생각할 여유가 주어지고 내 판단이 존중받는 자리에서 특히 힘을 내요. "}` +
      `돈은 크게 쓰기보다, 자기 기준이 분명한 영역에는 확실히 쓰고 아닌 데는 아끼는 '선택과 집중'형에 가까워요.`,
    goodEnvironment: buildGoodEnvironment(s),
    decisionPattern:
      s.saju.yinYangBias === "yang"
        ? "결정을 비교적 빨리 내리고, 실행하면서 배우는 편이에요. 속도가 강점이지만, 되돌리기 어려운 큰 선택(계약·이직·큰 지출)에는 '하루만 자고 결정하기' 규칙을 두면 후회가 확 줄어요."
        : "정보를 충분히 모은 뒤에 결정하는 편이라 실수는 적지만, 마감이 없으면 결정을 자꾸 미룰 수 있어요. 스스로 '결정 기한'을 못 박아두면 훨씬 편해져요.",
    action: "이번 주에 미뤄둔 결정 하나를 골라, 달력에 '이 날까지 정한다'고 마감일을 적어보세요. 미루는 습관을 끊는 가장 쉬운 방법이에요.",
  };
}

function buildRelationships(s: DerivedSignals): Synthesis["relationships"] {
  return {
    summary:
      `사람을 대하는 방식은, 마음이 편안해지는 방식을 보여주는 별자리(달 ${s.astro.moonKo})와 겉으로 드러나는 태도(일간 ${s.saju.dayMasterKo})를 함께 봐야 잘 읽혀요. ` +
      `관계에서 ${s.saju.yinYangBias === "yin" ? "천천히 신뢰를 확인한 뒤에 마음을 여는 편이라, 처음엔 거리감이 느껴져도 한번 곁을 내주면 깊고 오래가요. " : "호감을 비교적 빨리 표현하는 편이지만, '진짜 믿어도 되는 사람인가'를 재는 기준은 은근히 까다로워요. "}` +
      `그래서 겉으로 보이는 친밀함의 속도와, 속마음을 여는 속도가 서로 다를 수 있어요.`,
    expressionStyle:
      s.saju.yinYangBias === "yin"
        ? "속마음을 바로 꺼내기보다, 시간을 두고 상대를 지켜본 뒤에 조금씩 여는 편이에요. 그래서 '무슨 생각하는지 모르겠다'는 말을 들을 때가 있어요."
        : "좋으면 좋다고 비교적 솔직하게 표현하는 편이에요. 다만 그 속도가 상대보다 빠를 때 상대가 부담을 느낄 수 있으니, 상대의 온도도 함께 살펴보면 좋아요.",
    conflictPattern:
      "갈등이 생기면 그 자리에서 바로 부딪히기보다, 잠시 거리를 두고 혼자 정리한 뒤에 다시 대화하려는 편이에요. 이 '잠수'가 상대에겐 '나를 피한다'로 오해될 수 있으니, '지금 화난 게 아니라 생각 정리 중'이라고 한마디만 남겨두면 오해가 크게 줄어요.",
    action: "관계 초반에, 내가 편안하게 느끼는 '친해지는 속도'를 한 문장으로 알려주세요. 예: '난 좀 천천히 친해지는 편이야'. 이 한마디가 갑자기 거리 두는 패턴을 막아줘요.",
  };
}

function buildStress(s: DerivedSignals, el: (typeof ELEMENT_PLAIN)[FiveElement]): Synthesis["stressAndRecovery"] {
  const base = [
    "혼자 생각을 정리하는 시간과, 사람과 마음을 나누는 시간을 번갈아 두기 (한쪽만 오래 하면 지쳐요)",
    "몸을 가볍게 움직이는 짧은 활동(산책·스트레칭)으로 머릿속 과부하 덜기",
    "잠들기 전 '오늘 잘한 것 한 가지'만 적어보기 — 스스로를 몰아세우는 습관을 눅여줘요",
  ];
  if (s.astro.dominantElementKo === "물") base.push("답답한 감정은 글이나 메모로 밖에 꺼내두기 (안에 담아두면 한 번에 터져요)");
  if (s.saju.dominantElement === "fire") base.push("자극적인 일정 사이에 '아무것도 안 하는 시간'을 일부러 끼워넣기");
  if (s.saju.dominantElement === "earth") base.push("혼자 다 떠안지 말고, 작은 일부터 남에게 맡겨보기");
  return {
    summary:
      `스트레스는 대개 '해야 하는 일'과 '내가 편한 방식'이 어긋날 때 커지는 것으로 보여요. ` +
      `${el.name}의 기운이 강한 만큼, ${el.weak} 방향으로 지칠 때 신호가 나타나기 쉬워요. 중요한 건, 지치기 전에 '내 회복 방식'을 미리 알아두는 거예요.`,
    stressPattern:
      s.astro.dominantElementKo === "물"
        ? "감정을 속에 오래 담아두다가, 어느 순간 한꺼번에 지쳐버리는 형태로 쌓이기 쉬워요. '괜찮아'를 반복하다 몸이 먼저 신호를 보내는 유형이에요."
        : s.astro.dominantModalityKo === "활동"
          ? "할 일을 몰아서 처리하다가 회복 시간을 놓치는 형태로 나타나기 쉬워요. 쉬는 걸 '시간 낭비'처럼 느낄 때 특히 그래요."
          : "여러 가지를 동시에 신경 쓰다가 에너지가 조금씩 새어나가는 형태로 나타나기 쉬워요.",
    recoverySuggestions: base,
  };
}

function buildGoodEnvironment(s: DerivedSignals): string[] {
  const env: string[] = [];
  env.push(
    s.astro.dominantModalityKo === "활동"
      ? "새로운 시도가 허용되고, 결과가 비교적 빨리 눈에 보이는 환경"
      : s.astro.dominantModalityKo === "고정"
        ? "꾸준함과 전문성이 시간이 지날수록 인정받는 안정적인 환경"
        : "역할이 유연하게 바뀔 수 있고, 다양한 일을 다뤄볼 수 있는 환경",
  );
  env.push(
    s.saju.yinYangBias === "yin"
      ? "재촉당하지 않고 충분히 생각할 시간이 주어지는 환경"
      : "빠른 실행과 시원한 의사결정이 존중받는 환경",
  );
  env.push("내 판단과 기준이 존중받고, 성과가 눈에 보이게 쌓이는 환경");
  return env;
}

function buildConvergences(s: DerivedSignals): Synthesis["convergences"] {
  const items: Synthesis["convergences"] = [];
  items.push({
    title: "두 지도가 함께 가리키는 것 — 겉과 속의 온도 차",
    description:
      "동양의 사주와 서양의 별자리는 계산 방식이 완전히 다른데도, '겉으로 보이는 태도'와 '실제로 편안해지는 방식'이 서로 다르다는 점을 나란히 가리켜요. 서로 다른 두 언어가 같은 지점을 짚을 때, 그건 꽤 신뢰해도 좋은 신호예요.",
  });
  items.push({
    title: s.saju.yinYangBias === "yang" ? "두 지도 모두, 스스로 판을 움직이려는 힘을 봤어요" : "두 지도 모두, 안에서 정보를 모은 뒤 움직이는 신중함을 봤어요",
    description: s.convergenceHints[0],
  });
  if (s.convergenceHints[1]) {
    items.push({ title: "겹치는 또 하나의 신호", description: s.convergenceHints[1] });
  }
  return items;
}

function buildTension(s: DerivedSignals): Synthesis["tension"] {
  return {
    title: "두 지도가 다르게 말하는 지점 — 마음속 줄다리기",
    description:
      s.tensionHints[0] +
      " 이런 '서로 다른 두 마음'은 흠이 아니라, 대부분의 사람이 안에 품고 사는 자연스러운 긴장이에요. 다만 이 줄다리기를 모른 채 지내면, 스스로도 '나는 왜 이럴까' 하고 자책하기 쉬워요.",
    integrationAdvice:
      "둘 중 하나를 억지로 누르기보다, '상황에 따라 어느 쪽을 앞세울지'를 미리 정해두면 마음속 마찰이 훨씬 줄어요. 예를 들어 '일할 땐 속도, 관계에선 여유' 하는 식으로 나만의 규칙을 만들어두면 흔들릴 때 기준이 돼줘요.",
  };
}

function buildActions(s: DerivedSignals): Synthesis["actions"] {
  return [
    { period: "today", action: "오늘 15분만 내서, 미뤄둔 결정 하나를 종이에 적고 '언제까지 정할지' 마감일을 붙여보기" },
    { period: "relationship", action: "가까워지고 싶은 사람에게 '나는 이런 속도로 친해지는 편이야'라고 내 리듬을 한 문장으로 알려주기" },
    {
      period: "work",
      action:
        s.astro.dominantModalityKo === "활동"
          ? "벌여놓은 일 중 하나를 골라 '오늘 안에 끝까지 마무리'해보기 (시작보다 마무리에서 힘이 붙어요)"
          : "머릿속으로만 구상하던 일 하나를, 아주 작게라도 '오늘 첫 발'을 떼보기",
    },
    { period: "today", action: "잠들기 전, 오늘 나를 지치게 한 것과 나를 회복시킨 것을 각각 한 줄씩 적어 '내 회복 방식' 알아가기" },
  ];
}

function buildLimitations(input: SynthesisInput): string[] {
  const lims = [
    "이 리포트는 나를 이해하고 즐기기 위한 참고 자료예요. 정해진 미래를 알려주는 게 아니에요.",
    "병, 사고, 이별, 돈 문제 같은 걸 예언하지 않아요. 불안하게 만들려는 내용도 없어요.",
    "의료·법률·투자·심리상담을 대신할 수 없어요. 중요한 결정은 꼭 전문가와 상의하세요.",
  ];
  for (const w of input.saju.meta.warnings) lims.push(`사주 계산 참고: ${w}`);
  for (const w of input.astrology.meta.warnings) lims.push(`별자리 계산 참고: ${w}`);
  return lims.slice(0, 8);
}
