import { synthesisSchema } from "./schema";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  type SynthesisInput,
  type SynthesisProvider,
  type SynthesisResult,
} from "./provider";

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
            system,
            messages: [
              { role: "user", content: user },
            ],
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
        }
        const data = (await res.json()) as {
          content: { type: string; text: string }[];
          usage?: { input_tokens: number; output_tokens: number };
        };
        const raw = data.content?.map((c) => c.text).join("") ?? "";
        const json = extractJson(raw);
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

function extractJson(raw: string): unknown {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("JSON 응답을 찾을 수 없습니다.");
  return JSON.parse(raw.slice(first, last + 1));
}
