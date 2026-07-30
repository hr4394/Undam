import { z } from "zod";

/** AI 해석 응답 스키마. AI 는 반드시 이 JSON 형식만 출력한다.
 *  분량은 넉넉히 허용하되(길고 풍성한 리포트), 최소치도 요구해 빈약한 응답을 막는다. */
export const confidenceEnum = z.enum(["high", "medium", "limited"]);

export const coreInsightSchema = z.object({
  title: z.string().min(1).max(80),
  insight: z.string().min(1).max(2000),
  sajuEvidence: z.array(z.string()).min(1).max(8),
  astrologyEvidence: z.array(z.string()).min(1).max(8),
  realLifePattern: z.string().min(1).max(1200),
  strength: z.string().min(1).max(800),
  caution: z.string().min(1).max(800),
  action: z.string().min(1).max(800),
  confidence: confidenceEnum,
});

export const synthesisSchema = z.object({
  headline: z.string().min(1).max(120),
  summary: z.string().min(1).max(2000),
  keywords: z.array(z.string().min(1).max(24)).min(3).max(5),
  confidence: z.object({
    level: confidenceEnum,
    reason: z.string().min(1).max(600),
  }),
  // 삶의 큰 흐름(부드러운 서사). 구체적 사건 예언이 아니라 성향의 시기별 테마.
  lifeStory: z
    .object({
      title: z.string().min(1).max(80),
      narrative: z.string().min(1).max(2000),
    })
    .optional(),
  coreInsights: z.array(coreInsightSchema).min(3).max(6),
  workAndMoney: z.object({
    summary: z.string().min(1).max(1600),
    goodEnvironment: z.array(z.string()).min(1).max(8),
    decisionPattern: z.string().min(1).max(1000),
    action: z.string().min(1).max(800),
  }),
  relationships: z.object({
    summary: z.string().min(1).max(1600),
    expressionStyle: z.string().min(1).max(1000),
    conflictPattern: z.string().min(1).max(1000),
    action: z.string().min(1).max(800),
  }),
  stressAndRecovery: z.object({
    summary: z.string().min(1).max(1600),
    stressPattern: z.string().min(1).max(1000),
    recoverySuggestions: z.array(z.string()).min(1).max(8),
  }),
  convergences: z
    .array(
      z.object({
        title: z.string().min(1).max(80),
        description: z.string().min(1).max(1000),
      }),
    )
    .min(2)
    .max(5),
  tension: z.object({
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(1400),
    integrationAdvice: z.string().min(1).max(1000),
  }),
  // actions: 모델이 문자열/문자열배열/객체배열 중 무엇으로 주든 관용적으로 정규화한다.
  actions: z.preprocess(
    (val) => {
      const toItem = (x: unknown) =>
        typeof x === "string" ? { period: "today", action: x } : x;
      if (typeof val === "string") return [toItem(val)];
      if (Array.isArray(val)) return val.map(toItem);
      return val;
    },
    z
      .array(
        z.object({
          period: z
            .enum(["today", "relationship", "work"])
            .catch("today")
            .default("today"),
          action: z.string().min(1).max(500),
        }),
      )
      .min(1)
      .max(10),
  ),
  limitations: z.array(z.string()).min(1).max(8),
});

export type Synthesis = z.infer<typeof synthesisSchema>;
export type CoreInsight = z.infer<typeof coreInsightSchema>;
