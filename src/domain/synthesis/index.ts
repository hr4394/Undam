import type { SynthesisProvider } from "./provider";
import { MockSynthesisProvider } from "./mock";
import { AnthropicSynthesisProvider } from "./anthropic";
import { getServerEnv } from "@/config/env";

export * from "./provider";
export * from "./schema";
export { PROMPT_VERSION } from "./prompt";

/** 환경설정에 따라 Synthesis 제공자를 선택한다. */
export function createSynthesisProvider(): SynthesisProvider {
  const env = getServerEnv();
  switch (env.AI_PROVIDER) {
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error("AI_PROVIDER=anthropic 이지만 ANTHROPIC_API_KEY 가 없습니다.");
      }
      return new AnthropicSynthesisProvider({
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.AI_MODEL,
        maxTokens: env.AI_MAX_OUTPUT_TOKENS,
        timeoutMs: env.AI_TIMEOUT_MS,
        maxRetries: env.AI_MAX_RETRIES,
      });
    case "openai":
      // OpenAI 어댑터는 동일 인터페이스로 확장 가능(현재는 mock 로 폴백하지 않고 명시적 안내).
      throw new Error("OpenAI 어댑터는 아직 구성되지 않았습니다. AI_PROVIDER=mock 또는 anthropic 을 사용하세요.");
    case "mock":
    default:
      return new MockSynthesisProvider();
  }
}
