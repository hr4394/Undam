import { z } from "zod";
import { synthesisSchema } from "./schema";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  type SynthesisInput,
  type SynthesisProvider,
  type SynthesisResult,
} from "./provider";

// Zod 스키마 → JSON Schema 로 변환해 Anthropic tool 의 input_schema 로 사용한다.
// 이렇게 하면 모델이 '정확히 이 구조'로만 응답하도록 강제되어 필드 불일치가 사라진다.
const REPORT_INPUT_SCHEMA: Record<string, unknown> = (() => {
  const js = z.toJSONSchema(synthesisSchema) as Record<string, unknown>;
  delete js.$schema; // Anthropic input_schema 에는 불필요
  return js;
})();

const REPORT_TOOL = {
  name: "emit_report",
  description:
    "사주 × 서양점성술 종합 해석 리포트를 지정된 구조로 반환한다. 모든 필드를 한국어로 채운다.",
  input_schema: REPORT_INPUT_SCHEMA,
};

/**
 * AnthropicSynthesisProvider
 * Anthropic Messages API 어댑터. 응답을 Zod 로 검증하고 실패 시 제한 횟수 재시도한다.
 * 계속 실패하면 예외를 던져 상위(파이프라인)가 결제 복구/재처리 상태로 전환하게 한다.
 */
export interface AnthropicOptions {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeoutMs: number;
  maxRetries: number;
}

// 대략적 단가(USD/1M tokens) — 비용 추정용. 실제 청구는 콘솔 기준.
const PRICE_PER_MTOK: Record<string, { in: number; out: number }> = {
  default: { in: 3, out: 15 },
};
const USD_TO_KRW = 1400;

export class AnthropicSynthesisProvider implements SynthesisProvider {
  readonly name = "anthropic";
  constructor(private opts: AnthropicOptions) {}

  async generate(input: SynthesisInput): Promise<SynthesisResult> {
    const system = buildSystemPrompt();
    const user = buildUserPrompt(input);
    let lastErr: unknown;

    for (let attempt = 0; attempt <= this.opts.maxRetries; attempt++) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.opts.timeoutMs);
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": this.opts.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: this.opts.model,
            max_tokens: this.opts.maxTokens,
            // 확장 사고(thinking) 비활성화 — 사고에 토큰을 소진해 본문이 비는 문제 방지.
            thinking: { type: "disabled" },
            system,
            messages: [{ role: "user", content: user }],
            // 구조화 출력: 모델이 REPORT_TOOL 스키마대로만 응답하도록 강제.
            tools: [REPORT_TOOL],
            tool_choice: { type: "tool", name: "emit_report" },
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json()) as {
          content: { type: string; text?: string; input?: unknown }[];
          stop_reason?: string;
          usage?: { input_tokens: number; output_tokens: number };
        };
        // tool_use 블록의 input 이 곧 구조화된 리포트.
        const toolBlock = (data.content ?? []).find((c) => c.type === "tool_use");
        let json: unknown = toolBlock?.input;
        if (json == null) {
          // 폴백: 혹시 tool 이 아니라 text 로 왔다면 JSON 추출 시도
          const raw = (data.content ?? [])
            .filter((c) => c.type === "text")
            .map((c) => c.text ?? "")
            .join("")
            .trim();
          json = extractJson(raw, data.stop_reason);
        }
        const parsed = synthesisSchema.parse(json);

        const price = PRICE_PER_MTOK.default;
        const inTok = data.usage?.input_tokens ?? 0;
        const outTok = data.usage?.output_tokens ?? 0;
        const costKrw =
          ((inTok / 1_000_000) * price.in + (outTok / 1_000_000) * price.out) *
          USD_TO_KRW;

        return {
          synthesis: parsed,
          usage: {
            provider: "anthropic",
            model: this.opts.model,
            inputTokens: inTok,
            outputTokens: outTok,
            costKrw,
            latencyMs: Date.now() - start,
          },
        };
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(
      `AI 해석 생성 실패(재시도 ${this.opts.maxRetries}회 초과): ${String(lastErr)}`,
    );
  }
}

function extractJson(raw: string, stopReason?: string): unknown {
  let text = raw.trim();
  // ```json ... ``` 코드펜스가 있으면 내부만 추출
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) {
    throw new Error(
      `JSON 응답을 찾을 수 없습니다 (stop=${stopReason ?? "?"}, 길이=${raw.length}). 응답 앞부분: "${raw.slice(0, 300)}"`,
    );
  }
  return JSON.parse(text.slice(first, last + 1));
}
