import { computeChart } from "@/domain/pipeline";
import { MockSynthesisProvider } from "@/domain/synthesis/mock";
import type { BirthInput } from "@/domain/types";
import type { Synthesis } from "@/domain/synthesis/schema";
import type { ChartResult } from "@/domain/pipeline";

/** 가상 인물 샘플 (개인정보 아님). /sample 과 샘플 PDF 생성에 공용 사용. */
export const SAMPLE_BIRTH: BirthInput = {
  nickname: "이서준",
  gender: "unspecified",
  calendar: "solar",
  isLeapMonth: false,
  year: 1993,
  month: 7,
  day: 12,
  hour: 9,
  minute: 40,
  birthTimeUnknown: false,
  countryCode: "KR",
  cityId: "kr-seoul",
  interests: ["nature", "career", "relationship", "stress"],
  concernText: "요즘 진로를 다시 정하고 싶은데 방향을 못 잡겠어요.",
  tone: "warm",
};

export interface SampleReport {
  chart: ChartResult;
  synthesis: Synthesis;
}

export async function buildSampleReport(): Promise<SampleReport> {
  const chart = computeChart(SAMPLE_BIRTH);
  const provider = new MockSynthesisProvider();
  const { synthesis } = await provider.generate({
    birth: SAMPLE_BIRTH,
    saju: chart.saju,
    astrology: chart.astrology,
    concernText: SAMPLE_BIRTH.concernText,
  });
  return { chart, synthesis };
}
