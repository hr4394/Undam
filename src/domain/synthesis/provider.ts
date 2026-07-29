import type {
  AstrologyResult,
  BirthInput,
  Confidence,
  SajuResult,
} from "@/domain/types";
import type { Synthesis } from "./schema";

export interface SynthesisInput {
  birth: BirthInput;
  saju: SajuResult;
  astrology: AstrologyResult;
  /** 사용자가 선택 입력한 고민 (시스템 명령이 아니라 참고 데이터로만 취급) */
  concernText?: string;
}

export interface SynthesisUsage {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** 원(KRW) 추정 비용 */
  costKrw: number;
  latencyMs: number;
}

export interface SynthesisResult {
  synthesis: Synthesis;
  usage: SynthesisUsage;
}

export interface SynthesisProvider {
  readonly name: string;
  generate(input: SynthesisInput): Promise<SynthesisResult>;
}

/** 전체 계산 신뢰 수준 (출생 시간 확정 여부 등) */
export function overallConfidence(input: SynthesisInput): Confidence {
  if (!input.saju.meta.birthTimeKnown) return "limited";
  const warns =
    input.saju.meta.warnings.length + input.astrology.meta.warnings.length;
  if (warns > 0) return "medium";
  return "high";
}
