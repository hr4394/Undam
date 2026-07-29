import { describe, it, expect } from "vitest";
import { computeChart } from "@/domain/pipeline";
import { MockSynthesisProvider } from "@/domain/synthesis/mock";
import { synthesisSchema } from "@/domain/synthesis/schema";
import { makeBirth } from "./fixtures";

describe("MockSynthesisProvider", () => {
  it("계산 결과로부터 스키마를 통과하는 해석을 생성한다", async () => {
    const chart = computeChart(makeBirth());
    const provider = new MockSynthesisProvider();
    const { synthesis } = await provider.generate({
      birth: chart.normalized.original,
      saju: chart.saju,
      astrology: chart.astrology,
    });
    const parsed = synthesisSchema.safeParse(synthesis);
    expect(parsed.success).toBe(true);
    expect(synthesis.keywords).toHaveLength(3);
    expect(synthesis.coreInsights.length).toBeGreaterThanOrEqual(2);
    expect(synthesis.actions.length).toBeGreaterThanOrEqual(3);
  });

  it("출생 시간 미상이면 신뢰도가 limited 이고 한계에 안내가 포함된다", async () => {
    const chart = computeChart(
      makeBirth({ birthTimeUnknown: true, hour: null, minute: null }),
    );
    const provider = new MockSynthesisProvider();
    const { synthesis } = await provider.generate({
      birth: chart.normalized.original,
      saju: chart.saju,
      astrology: chart.astrology,
    });
    expect(synthesis.confidence.level).toBe("limited");
    expect(synthesis.limitations.join(" ")).toContain("시주");
  });
});
