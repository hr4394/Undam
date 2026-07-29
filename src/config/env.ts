import { z } from "zod";

/**
 * 서버 환경변수 검증. 서버 코드에서만 import 한다(브라우저 노출 금지).
 * 잘못된 설정은 부팅 시점에 명확히 실패하게 한다.
 */
const boolFromString = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null ? def : v === "true"));

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  TOKEN_HASH_SECRET: z
    .string()
    .min(16, "TOKEN_HASH_SECRET must be at least 16 chars"),
  ADMIN_PASSWORD: z.string().min(4, "ADMIN_PASSWORD required"),

  AI_PROVIDER: z.enum(["mock", "anthropic", "openai"]).default("mock"),
  AI_MODEL: z.string().default("claude-sonnet-5"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(4000),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),

  PAYMENT_PROVIDER: z.enum(["mock", "toss"]).default("mock"),
  TOSS_SECRET_KEY: z.string().optional().default(""),
  ALLOW_MOCK_PAYMENT_IN_PROD: boolFromString(false),

  SAJU_USE_TRUE_SOLAR_TIME: boolFromString(true),
  SAJU_DAY_BOUNDARY: z.enum(["midnight", "early-zi"]).default("midnight"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`잘못된 환경변수 설정:\n${issues}`);
  }
  cached = parsed.data;

  // 운영 환경에서 mock 결제 차단 (명시적 허용 없으면 금지)
  if (
    cached.NODE_ENV === "production" &&
    cached.PAYMENT_PROVIDER === "mock" &&
    !cached.ALLOW_MOCK_PAYMENT_IN_PROD
  ) {
    throw new Error(
      "운영 환경에서 mock 결제는 차단됩니다. PAYMENT_PROVIDER=toss 로 설정하세요.",
    );
  }
  return cached;
}

/** 계산 정책만 필요한 곳에서 가볍게 사용 */
export const sajuPolicy = {
  useTrueSolarTime: process.env.SAJU_USE_TRUE_SOLAR_TIME !== "false",
  dayBoundary: (process.env.SAJU_DAY_BOUNDARY as "midnight" | "early-zi") ?? "midnight",
} as const;
