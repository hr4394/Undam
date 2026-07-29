import type { Synthesis } from "./schema";
import { synthesisSchema } from "./schema";
import { deriveSignals } from "./derive";
import {
  overallConfidence,
  type SynthesisInput,
  type SynthesisProvider,
  type SynthesisResult,
} from "./provider";

/**
 * MockSynthesisProvider
 * API 키 없이 전체 흐름을 테스트/데모하기 위한 제공자.
 * 무작위 문장을 만들지 않고, 실제 계산 결과(오행 분포·일간·태양/달/상승궁·주요 애스펙트)에서
 * 신호를 도출해 결정론적으로 리포트를 구성한다. 근거 없는 단언은 하지 않는다.
 */
export class MockSynthesisProvider implements SynthesisProvider {
  readonly name = "mock";

  async generate(input: SynthesisInput): Promise<SynthesisResult> {
    const start = Date.now();
    const s = deriveSignals(input.saju, input.astrology);
    const level = overallConfidence(input);
    const tone = input.birth.tone;

    const nudge =
      tone === "warm"
        ? "천천히 살펴봐도 괜찮습니다."
        : tone === "concise"
          ? "핵심만 짚습니다."
          : "관찰 가능한 패턴 위주로 정리합니다.";

    const keywords = buildKeywords(s);

    const synthesis: Synthesis = {
      headline: `${s.saju.dayMasterElementKo} 기운의 ${s.astro.sunKo}, 안과 밖이 다른 리듬`,
      summary:
        `일간은 ${s.saju.dayMasterKo}(${s.saju.dayMasterElementKo})이고 사주에서 ${s.saju.dominantElementKo} 기운이 두드러집니다. ` +
        `서양 차트에서는 태양 ${s.astro.sunKo}, 달 ${s.astro.moonKo}${s.astro.ascKo ? `, 상승 ${s.astro.ascKo}` : ""}로, ` +
        `${s.astro.dominantElementKo}·${s.astro.dominantModalityKo} 성향이 강조됩니다. ${nudge}`,
      keywords,
      confidence: {
        level,
        reason: buildConfidenceReason(input, level),
      },
      coreInsights: buildCoreInsights(s, level),
      workAndMoney: {
        summary: `${s.astro.dominantModalityKo} 성향과 ${s.saju.dominantElementKo} 기운은 일을 대하는 방식에서 ${
          s.astro.dominantModalityKo === "활동" ? "먼저 시작하고 굴러가면서 다듬는" : "구조를 세운 뒤 움직이는"
        } 흐름으로 나타날 수 있습니다.`,
        goodEnvironment: buildGoodEnvironment(s),
        decisionPattern:
          s.saju.yinYangBias === "yang"
            ? "결정을 빨리 내리고 실행하며 배우는 편으로 해석됩니다. 되돌리기 비용이 큰 선택에는 하루의 유예를 두면 후회를 줄일 수 있습니다."
            : "정보를 충분히 모은 뒤 결정하는 편으로 해석됩니다. 마감이 없으면 결정을 미룰 수 있어, 스스로 결정 기한을 정해두면 도움이 됩니다.",
        action: "이번 주에 미뤄둔 결정 하나에 마감 날짜를 붙여보세요.",
      },
      relationships: {
        summary: `달 ${s.astro.moonKo}는 감정이 안정되는 방식을, 일간 ${s.saju.dayMasterKo}는 관계에서 드러내는 태도를 가리킵니다.`,
        expressionStyle:
          s.saju.yinYangBias === "yin"
            ? "속마음을 바로 드러내기보다 시간을 두고 신뢰를 확인한 뒤 여는 편으로 해석됩니다."
            : "호감을 비교적 빠르게 표현하는 편이지만, 신뢰의 기준은 까다로울 수 있습니다.",
        conflictPattern:
          "갈등이 생기면 즉시 부딪히기보다 잠시 거리를 두고 정리한 뒤 다시 대화하려는 패턴이 나타날 수 있습니다.",
        action: "관계 초기에 자신이 편안한 친밀감의 속도를 한 문장으로 설명해 보세요.",
      },
      stressAndRecovery: {
        summary: "긴장은 대개 '해야 할 일'과 '하고 싶은 방식'이 어긋날 때 커지는 것으로 해석됩니다.",
        stressPattern:
          s.astro.dominantElementKo === "물"
            ? "감정을 오래 담아두다 한 번에 지치는 형태로 스트레스가 쌓일 수 있습니다."
            : "할 일을 몰아서 처리하다 회복 시간을 놓치는 형태로 나타날 수 있습니다.",
        recoverySuggestions: buildRecovery(s),
      },
      convergences: s.convergenceHints.map((h, i) => ({
        title: i === 0 ? "두 지도가 함께 가리키는 곳" : "겹치는 또 하나의 신호",
        description: h,
      })),
      tension: {
        title: "서로 다르게 말하는 지점",
        description: s.tensionHints[0],
        integrationAdvice:
          "둘 중 하나를 억누르기보다, 상황에 따라 어느 쪽을 앞세울지 미리 정해두면 내적 마찰이 줄어듭니다.",
      },
      actions: [
        { period: "today", action: "오늘 15분, 결정이 필요한 일 하나만 종이에 적고 마감일을 붙이기" },
        { period: "relationship", action: "가까운 사람에게 요즘 편안하게 느끼는 대화 속도를 알려주기" },
        { period: "work", action: `${s.astro.dominantModalityKo === "활동" ? "시작한 일 중 하나를 끝까지 마무리" : "구상만 하던 일 하나를 작게 시작"}하기` },
      ],
      limitations: buildLimitations(input),
    };

    // mock 도 반드시 스키마를 통과해야 한다(형식 계약 보장).
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

function buildKeywords(s: ReturnType<typeof deriveSignals>): [string, string, string] {
  const a =
    s.saju.yinYangBias === "yang" ? "능동적 시작" : s.saju.yinYangBias === "yin" ? "신중한 관찰" : "균형 잡힌 태도";
  const b = `${s.astro.dominantElementKo} 중심 감정`;
  const c = s.astro.dominantModalityKo === "활동" ? "추진력" : s.astro.dominantModalityKo === "고정" ? "지속력" : "적응력";
  return [a, b, c];
}

function buildConfidenceReason(input: SynthesisInput, level: string): string {
  if (level === "limited")
    return "출생 시간을 몰라 시주·상승궁·하우스를 제외하고, 시간에 무관한 요소만으로 해석했습니다.";
  if (level === "medium")
    return "계산 경고가 일부 있어 시간 민감 항목의 신뢰 수준을 조정했습니다.";
  return "출생 시간이 확정되어 사주 원국과 출생 차트를 온전히 사용했습니다.";
}

function buildCoreInsights(
  s: ReturnType<typeof deriveSignals>,
  level: "high" | "medium" | "limited",
): Synthesis["coreInsights"] {
  const insights: Synthesis["coreInsights"] = [
    {
      title: "겉모습과 속마음의 리듬 차이",
      insight: `${s.astro.ascKo ? `상승 ${s.astro.ascKo}로 보이는 첫인상과, ` : ""}달 ${s.astro.moonKo}가 가리키는 실제 감정 리듬이 다를 수 있습니다. 처음에는 ${s.saju.yinYangBias === "yang" ? "적극적" : "차분"}으로 보이지만, 편안해지는 방식은 그와 다를 수 있습니다.`,
      sajuEvidence: [
        `일간 ${s.saju.dayMasterKo}(${s.saju.dayMasterElementKo})`,
        `음양 편향: ${s.saju.yinYangBias === "yang" ? "양" : s.saju.yinYangBias === "yin" ? "음" : "균형"}`,
      ],
      astrologyEvidence: [
        `태양 ${s.astro.sunKo} / 달 ${s.astro.moonKo}`,
        s.astro.ascKo ? `상승 ${s.astro.ascKo}` : "상승궁 미확정(출생 시간 필요)",
      ],
      realLifePattern:
        "처음 만난 자리에서는 무난히 어울리지만, 정말 편해지기까지는 시간이 필요한 편으로 나타날 수 있습니다.",
      strength: "상황에 맞춰 겉으로 드러내는 모습을 조절할 수 있습니다.",
      caution: "겉과 속의 간극이 커지면 스스로 지칠 수 있습니다.",
      action: "가까운 관계에서는 첫인상과 다른 실제 성향을 한두 가지 미리 알려두기.",
      confidence: level,
    },
    {
      title: `두드러진 ${s.saju.dominantElementKo} 기운의 사용법`,
      insight: `사주에서 ${s.saju.dominantElementKo} 기운이 강조됩니다. ${
        s.saju.lackingElementsKo.length
          ? `반면 ${s.saju.lackingElementsKo.join("·")} 기운은 상대적으로 약해, 이 영역에서는 의식적인 보완이 도움이 됩니다.`
          : "오행이 비교적 고르게 분포해 특정 영역에 치우치지 않는 편입니다."
      }`,
      sajuEvidence: [
        `${s.saju.dominantElementKo} 우세`,
        s.saju.lackingElementsKo.length ? `${s.saju.lackingElementsKo.join("·")} 약함` : "오행 분포 비교적 균형",
      ],
      astrologyEvidence: [
        `${s.astro.dominantElementKo} 원소 강조`,
        `${s.astro.dominantModalityKo} 양식 강조`,
      ],
      realLifePattern:
        "강한 기운은 평소엔 장점으로 쓰이지만, 과해지면 같은 성향이 피로의 원인이 되기도 합니다.",
      strength: `${s.saju.dominantElementKo} 기운이 필요한 상황에서 안정적으로 힘을 냅니다.`,
      caution: "잘하는 방식만 반복하면 약한 영역이 더 약해질 수 있습니다.",
      action: s.saju.lackingElementsKo.length
        ? `${s.saju.lackingElementsKo[0]} 기운과 연결된 활동(휴식·소통·정리 등)을 주 1회 의식적으로 넣기.`
        : "이미 균형이 좋은 편이니, 잘 되는 루틴을 기록해 재현하기.",
      confidence: level,
    },
  ];

  // 애스펙트가 뚜렷하면 통찰 추가
  if (s.astro.tightestAspects.length > 0) {
    const asp = s.astro.tightestAspects[0];
    insights.push({
      title: "내면의 두 힘이 부딪히거나 협력하는 지점",
      insight: `${asp.text}(오브 ${asp.orb.toFixed(1)}°)는 서로 다른 두 욕구가 자주 만나는 지점을 가리킵니다. 이 조합은 상황에 따라 추진력이 되기도, 갈등이 되기도 합니다.`,
      sajuEvidence: [`일간 ${s.saju.dayMasterKo} 기준 성향`],
      astrologyEvidence: s.astro.tightestAspects.map((a) => `${a.text} (오브 ${a.orb.toFixed(1)}°)`),
      realLifePattern:
        "중요한 선택 앞에서 마음이 두 갈래로 나뉘어, 결정을 내린 뒤에도 되돌아보는 패턴이 나타날 수 있습니다.",
      strength: "서로 다른 관점을 동시에 고려하는 균형 감각이 있습니다.",
      caution: "둘 사이에서 결정을 미루면 기회를 놓칠 수 있습니다.",
      action: "결정이 어려울 때, 두 선택지의 최악의 경우를 각각 한 줄로 적고 비교하기.",
      confidence: level,
    });
  }

  return insights.slice(0, 4);
}

function buildGoodEnvironment(s: ReturnType<typeof deriveSignals>): string[] {
  const env: string[] = [];
  env.push(
    s.astro.dominantModalityKo === "활동"
      ? "새로운 시도가 허용되고 결과가 빨리 보이는 환경"
      : s.astro.dominantModalityKo === "고정"
        ? "꾸준함이 성과로 인정받는 안정적인 환경"
        : "역할이 유연하게 바뀔 수 있는 환경",
  );
  env.push(
    s.saju.yinYangBias === "yin"
      ? "충분히 생각할 시간이 주어지는 환경"
      : "빠른 실행이 존중받는 환경",
  );
  return env;
}

function buildRecovery(s: ReturnType<typeof deriveSignals>): string[] {
  const base = [
    "혼자 정리하는 시간과 사람과 나누는 시간을 번갈아 두기",
    "몸을 움직이는 짧은 활동으로 생각의 과부하 줄이기",
  ];
  if (s.astro.dominantElementKo === "물") base.push("감정을 글로 적어 밖으로 꺼내기");
  if (s.saju.dominantElementKo.includes("화")) base.push("자극적인 일정 사이에 의도적인 공백 넣기");
  return base;
}

function buildLimitations(input: SynthesisInput): string[] {
  const lims = [
    "이 리포트는 자기이해와 오락을 위한 참고 자료이며, 미래를 보장하지 않습니다.",
    "의료·법률·투자·심리상담을 대체하지 않습니다.",
  ];
  for (const w of input.saju.meta.warnings) lims.push(`사주 계산 참고: ${w}`);
  for (const w of input.astrology.meta.warnings) lims.push(`점성술 계산 참고: ${w}`);
  return lims.slice(0, 6);
}
