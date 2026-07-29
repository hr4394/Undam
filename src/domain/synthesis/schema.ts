import { z } from "zod";

/** AI 해석 응답 스키마. AI 는 반드시 이 JSON 형식만 출력한다. */
export const confidenceEnum = z.enum(["high", "medium", "limited"]);

export const coreInsightSchema = z.object({
  title: z.string().min(1).max(60),
  insight: z.string().min(1).max(600),
  sajuEvidence: z.array(z.string()).min(1).max(6),
  astrologyEvidence: z.array(z.string()).min(1).max(6),
  realLifePattern: z.string().min(1).max(400),
  strength: z.string().min(1).max(300),
  caution: z.string().min(1).max(300),
  action: z.string().min(1).max(300),
  confidence: confidenceEnum,
});

export const synthesisSchema = z.object({
  headline: z.string().min(1).max(80),
  summary: z.string().min(1).max(500),
  keywords: z.array(z.string().min(1).max(20)).min(3).max(3),
  confidence: z.object({
    level: confidenceEnum,
    reason: z.string().min(1).max(300),
  }),
  coreInsights: z.array(coreInsightSchema).min(2).max(4),
  workAndMoney: z.object({
    summary: z.string().min(1).max(500),
    goodEnvironment: z.array(z.string()).min(1).max(5),
    decisionPattern: z.string().min(1).max(400),
    action: z.string().min(1).max(300),
  }),
  relationships: z.object({
    summary: z.string().min(1).max(500),
    expressionStyle: z.string().min(1).max(400),
    conflictPattern: z.string().min(1).max(400),
    action: z.string().min(1).max(300),
  }),
  stressAndRecovery: z.object({
    summary: z.string().min(1).max(500),
    stressPattern: z.string().min(1).max(400),
    recoverySuggestions: z.array(z.string()).min(1).max(6),
  }),
  convergences: z
    .array(
      z.object({
        title: z.string().min(1).max(60),
        description: z.string().min(1).max(400),
      }),
    )
    .min(1)
    .max(4),
  tension: z.object({
    title: z.string().min(1).max(60),
    description: z.string().min(1).max(500),
    integrationAdvice: z.string().min(1).max(400),
  }),
  actions: z
    .array(
      z.object({
        period: z.enum(["today", "relationship", "work"]),
        action: z.string().min(1).max(200),
      }),
    )
    .min(3)
    .max(6),
  limitations: z.array(z.string()).min(1).max(6),
});

export type Synthesis = z.infer<typeof synthesisSchema>;
export type CoreInsight = z.infer<typeof coreInsightSchema>;
