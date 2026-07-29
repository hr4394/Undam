import type { BirthInput } from "@/domain/types";

export function makeBirth(overrides: Partial<BirthInput> = {}): BirthInput {
  return {
    nickname: "테스터",
    gender: "unspecified",
    calendar: "solar",
    isLeapMonth: false,
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    birthTimeUnknown: false,
    countryCode: "KR",
    cityId: "kr-seoul",
    interests: ["nature", "career"],
    tone: "analytic",
    ...overrides,
  };
}
