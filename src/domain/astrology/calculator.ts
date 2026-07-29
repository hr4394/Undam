// circular-natal-horoscope-js 는 타입 정의를 제공하지 않아 require 로 불러온다.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Origin, Horoscope } = require("circular-natal-horoscope-js");

import type {
  AstroElement,
  AstroModality,
  AstrologyResult,
  Aspect,
  NormalizedBirth,
  PlanetPosition,
} from "@/domain/types";
import {
  ASPECT_KO,
  CORE_PLANETS,
  PLANET_KO,
  SIGN_ELEMENT,
  SIGN_KO,
  SIGN_MODALITY,
} from "./tables";

const ENGINE = "circular-natal-horoscope-js";
const ENGINE_VERSION = "1.1.x";

/**
 * AstrologyCalculator
 * Tropical / Placidus / Geocentric 출생 차트.
 * - Origin 이 좌표 기반으로 IANA 시간대와 일광절약시간을 자동 반영한다.
 * - 출생 시간 미상이면 상승궁/하우스를 확정하지 않고, 달의 별자리 경계 모호성을 표시한다.
 */
export function calculateAstrology(birth: NormalizedBirth): AstrologyResult {
  const warnings: string[] = [];
  const { gregorian, birthTimeKnown } = birth;

  const origin = new Origin({
    year: gregorian.year,
    month: gregorian.month - 1, // 라이브러리는 0-indexed
    date: gregorian.day,
    hour: birthTimeKnown ? gregorian.hour : 12,
    minute: birthTimeKnown ? gregorian.minute : 0,
    latitude: birth.latitude,
    longitude: birth.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies"],
    aspectWithPoints: ["bodies"],
    aspectTypes: ["major"],
    language: "en",
  });

  const elementCounts: Record<AstroElement, number> = {
    fire: 0, earth: 0, air: 0, water: 0,
  };
  const modalityCounts: Record<AstroModality, number> = {
    cardinal: 0, fixed: 0, mutable: 0,
  };

  const planets: PlanetPosition[] = [];
  for (const key of CORE_PLANETS) {
    const body = horoscope.CelestialBodies[key];
    if (!body) continue;
    const signKey: string = body.Sign.key;
    const longitude: number = body.ChartPosition.Ecliptic.DecimalDegrees;
    const degree = ((longitude % 30) + 30) % 30;
    planets.push({
      key,
      nameKo: PLANET_KO[key] ?? key,
      sign: signKey,
      signKo: SIGN_KO[signKey] ?? signKey,
      degree,
      longitude,
      house: birthTimeKnown && body.House ? body.House.id : null,
      retrograde: Boolean(body.isRetrograde),
    });
    // 원소/양식 분포는 주요 천체 기준 카운트
    elementCounts[SIGN_ELEMENT[signKey]] += 1;
    modalityCounts[SIGN_MODALITY[signKey]] += 1;
  }

  let ascendant: AstrologyResult["ascendant"] = null;
  let midheaven: AstrologyResult["midheaven"] = null;
  let houses: AstrologyResult["houses"] = null;

  if (birthTimeKnown) {
    const asc = horoscope.Ascendant;
    ascendant = {
      sign: asc.Sign.key,
      signKo: SIGN_KO[asc.Sign.key] ?? asc.Sign.key,
      degree: ((asc.ChartPosition.Ecliptic.DecimalDegrees % 30) + 30) % 30,
    };
    const mc = horoscope.Midheaven;
    midheaven = {
      sign: mc.Sign.key,
      signKo: SIGN_KO[mc.Sign.key] ?? mc.Sign.key,
      degree: ((mc.ChartPosition.Ecliptic.DecimalDegrees % 30) + 30) % 30,
    };
    houses = horoscope.Houses.map((hs: unknown, i: number) => {
      const house = hs as {
        Sign: { key: string };
        ChartPosition: { StartPosition: { Ecliptic: { DecimalDegrees: number } } };
      };
      return {
        house: i + 1,
        sign: house.Sign.key,
        signKo: SIGN_KO[house.Sign.key] ?? house.Sign.key,
        degree:
          ((house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees % 30) +
            30) %
          30,
      };
    });
  } else {
    warnings.push("출생 시간을 몰라 상승궁·하우스를 확정하지 않았습니다.");
  }

  // 달의 별자리 경계 모호성: 시간 미상 시 정오 기준. 달은 하루 약 12~14도 이동하므로
  // 별자리 경계(±6.5도) 근처면 다른 별자리일 가능성을 표시한다.
  const moon = planets.find((p) => p.key === "moon");
  let moonSignAmbiguous = false;
  let moonAltSign: AstrologyResult["moonAltSign"] = null;
  if (!birthTimeKnown && moon) {
    if (moon.degree <= 6.5 || moon.degree >= 23.5) {
      moonSignAmbiguous = true;
      // 인접 별자리 계산
      const signs = Object.keys(SIGN_KO);
      const idx = signs.indexOf(moon.sign);
      const altIdx = moon.degree <= 6.5 ? (idx + 11) % 12 : (idx + 1) % 12;
      moonAltSign = { signKo: SIGN_KO[signs[altIdx]] };
      warnings.push(
        "출생 시간을 몰라 달의 별자리가 인접 별자리일 가능성이 있습니다(정오 기준 계산).",
      );
    }
  }

  const aspects: Aspect[] = (horoscope.Aspects.all as unknown[])
    .map((raw) => {
      const a = raw as {
        point1Key: string;
        point2Key: string;
        aspectKey: string;
        orb: number;
      };
      return a;
    })
    .filter(
      (a) =>
        (CORE_PLANETS as readonly string[]).includes(a.point1Key) &&
        (CORE_PLANETS as readonly string[]).includes(a.point2Key) &&
        ASPECT_KO[a.aspectKey],
    )
    .map((a) => ({
      a: a.point1Key,
      b: a.point2Key,
      type: a.aspectKey,
      typeKo: ASPECT_KO[a.aspectKey],
      orb: Number(a.orb),
    }))
    .sort((x, y) => x.orb - y.orb);

  return {
    planets,
    ascendant,
    midheaven,
    houses,
    elementCounts,
    modalityCounts,
    aspects,
    moonSignAmbiguous,
    moonAltSign,
    meta: {
      engine: ENGINE,
      engineVersion: ENGINE_VERSION,
      zodiac: "tropical",
      houseSystem: "placidus",
      geocentric: true,
      timezone: birth.timezone,
      latitude: birth.latitude,
      longitude: birth.longitude,
      birthTimeKnown,
      warnings,
    },
  };
}
