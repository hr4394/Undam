import { z } from "zod";
import { INTEREST_AREAS } from "@/domain/types";
import { findCityById } from "@/domain/location/cities";

/** 서버 입력 검증용 출생 입력 스키마 */
export const birthInputSchema = z
  .object({
    nickname: z.string().trim().min(1, "이름/닉네임을 입력하세요").max(20),
    gender: z.enum(["male", "female", "unspecified"]),
    calendar: z.enum(["solar", "lunar"]),
    isLeapMonth: z.boolean(),
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23).nullable(),
    minute: z.number().int().min(0).max(59).nullable(),
    birthTimeUnknown: z.boolean(),
    countryCode: z.string().length(2),
    cityId: z.string().min(1),
    interests: z.array(z.enum(INTEREST_AREAS)).min(1, "관심 분야를 하나 이상 선택하세요").max(7),
    concernText: z.string().trim().max(500).optional(),
    tone: z.enum(["warm", "analytic", "concise"]),
  })
  .refine((v) => findCityById(v.cityId), { message: "알 수 없는 도시입니다", path: ["cityId"] })
  .refine(
    (v) => {
      // 날짜 유효성(윤년 포함)은 양력 기준으로만 엄격 검증
      if (v.calendar !== "solar") return true;
      const d = new Date(Date.UTC(v.year, v.month - 1, v.day));
      return (
        d.getUTCFullYear() === v.year &&
        d.getUTCMonth() === v.month - 1 &&
        d.getUTCDate() === v.day
      );
    },
    { message: "존재하지 않는 날짜입니다", path: ["day"] },
  )
  .refine((v) => v.birthTimeUnknown || (v.hour != null && v.minute != null), {
    message: "출생 시간을 입력하거나 '시간 모름'을 선택하세요",
    path: ["hour"],
  });

export type BirthInputDTO = z.infer<typeof birthInputSchema>;

/** 필수 동의 검증 */
export const consentSchema = z.object({
  service: z.literal(true),
  privacy: z.literal(true),
  age: z.literal(true),
  marketing: z.boolean().default(false),
});
