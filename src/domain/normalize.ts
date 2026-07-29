import { Lunar, Solar } from "lunar-typescript";
import { DateTime } from "luxon";
import type { BirthInput, NormalizedBirth } from "@/domain/types";
import { findCityById } from "@/domain/location/cities";

/**
 * BirthDataNormalizer + CalendarConverter + LocationResolver + TimezoneResolver.
 * 원본 입력을 그레고리력(양력) 확정 시각 + 좌표 + 시간대로 정규화한다.
 */
export function normalizeBirth(input: BirthInput): NormalizedBirth {
  const city = findCityById(input.cityId);
  if (!city) {
    throw new Error(`알 수 없는 도시: ${input.cityId}`);
  }

  // 1) 달력 변환: 음력 → 양력
  let gy = input.year;
  let gm = input.month;
  let gd = input.day;
  if (input.calendar === "lunar") {
    // 윤달은 음수 월로 표현(lunar-typescript 규약)
    const month = input.isLeapMonth ? -input.month : input.month;
    const lunar = Lunar.fromYmd(input.year, month, input.day);
    const solar: Solar = lunar.getSolar();
    gy = solar.getYear();
    gm = solar.getMonth();
    gd = solar.getDay();
  }

  const birthTimeKnown = !input.birthTimeUnknown && input.hour != null;
  const hour = birthTimeKnown ? (input.hour as number) : 12;
  const minute = birthTimeKnown ? (input.minute ?? 0) : 0;

  // 2) 시간대/오프셋: 해당 출생 시각의 IANA 시간대 오프셋(일광절약시간 반영)
  const dt = DateTime.fromObject(
    { year: gy, month: gm, day: gd, hour, minute },
    { zone: city.timezone },
  );
  const utcOffsetMinutes = dt.isValid ? dt.offset : 0;

  return {
    gregorian: { year: gy, month: gm, day: gd, hour, minute },
    birthTimeKnown,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
    utcOffsetMinutes,
    cityLabel: `${city.country} · ${city.name}`,
    original: input,
  };
}
