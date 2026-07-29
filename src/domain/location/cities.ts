/**
 * 출생지 도시 데이터(위도/경도/IANA 시간대).
 * 좌표는 도시 중심 근사값이며, 사주/점성술 계산 정확도에 필요한 수준으로 관리한다.
 * 필요 시 항목을 추가하거나 외부 지오코딩으로 대체할 수 있다.
 */
export interface City {
  id: string;
  countryCode: string;
  country: string;
  name: string; // 한글
  aliases?: string[]; // 검색용 (영문/별칭)
  latitude: number;
  longitude: number;
  timezone: string; // IANA
}

export const CITIES: City[] = [
  // 대한민국
  { id: "kr-seoul", countryCode: "KR", country: "대한민국", name: "서울", aliases: ["seoul"], latitude: 37.5665, longitude: 126.978, timezone: "Asia/Seoul" },
  { id: "kr-busan", countryCode: "KR", country: "대한민국", name: "부산", aliases: ["busan"], latitude: 35.1796, longitude: 129.0756, timezone: "Asia/Seoul" },
  { id: "kr-incheon", countryCode: "KR", country: "대한민국", name: "인천", aliases: ["incheon"], latitude: 37.4563, longitude: 126.7052, timezone: "Asia/Seoul" },
  { id: "kr-daegu", countryCode: "KR", country: "대한민국", name: "대구", aliases: ["daegu"], latitude: 35.8714, longitude: 128.6014, timezone: "Asia/Seoul" },
  { id: "kr-daejeon", countryCode: "KR", country: "대한민국", name: "대전", aliases: ["daejeon"], latitude: 36.3504, longitude: 127.3845, timezone: "Asia/Seoul" },
  { id: "kr-gwangju", countryCode: "KR", country: "대한민국", name: "광주", aliases: ["gwangju"], latitude: 35.1595, longitude: 126.8526, timezone: "Asia/Seoul" },
  { id: "kr-ulsan", countryCode: "KR", country: "대한민국", name: "울산", aliases: ["ulsan"], latitude: 35.5384, longitude: 129.3114, timezone: "Asia/Seoul" },
  { id: "kr-suwon", countryCode: "KR", country: "대한민국", name: "수원", aliases: ["suwon"], latitude: 37.2636, longitude: 127.0286, timezone: "Asia/Seoul" },
  { id: "kr-jeonju", countryCode: "KR", country: "대한민국", name: "전주", aliases: ["jeonju"], latitude: 35.8242, longitude: 127.148, timezone: "Asia/Seoul" },
  { id: "kr-cheongju", countryCode: "KR", country: "대한민국", name: "청주", aliases: ["cheongju"], latitude: 36.6424, longitude: 127.489, timezone: "Asia/Seoul" },
  { id: "kr-chuncheon", countryCode: "KR", country: "대한민국", name: "춘천", aliases: ["chuncheon"], latitude: 37.8813, longitude: 127.7298, timezone: "Asia/Seoul" },
  { id: "kr-gangneung", countryCode: "KR", country: "대한민국", name: "강릉", aliases: ["gangneung"], latitude: 37.7519, longitude: 128.8761, timezone: "Asia/Seoul" },
  { id: "kr-jeju", countryCode: "KR", country: "대한민국", name: "제주", aliases: ["jeju"], latitude: 33.4996, longitude: 126.5312, timezone: "Asia/Seoul" },
  // 해외 주요 도시
  { id: "us-newyork", countryCode: "US", country: "미국", name: "뉴욕", aliases: ["new york", "newyork"], latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" },
  { id: "us-losangeles", countryCode: "US", country: "미국", name: "로스앤젤레스", aliases: ["los angeles", "la"], latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles" },
  { id: "jp-tokyo", countryCode: "JP", country: "일본", name: "도쿄", aliases: ["tokyo"], latitude: 35.6762, longitude: 139.6503, timezone: "Asia/Tokyo" },
  { id: "jp-osaka", countryCode: "JP", country: "일본", name: "오사카", aliases: ["osaka"], latitude: 34.6937, longitude: 135.5023, timezone: "Asia/Tokyo" },
  { id: "cn-beijing", countryCode: "CN", country: "중국", name: "베이징", aliases: ["beijing"], latitude: 39.9042, longitude: 116.4074, timezone: "Asia/Shanghai" },
  { id: "cn-shanghai", countryCode: "CN", country: "중국", name: "상하이", aliases: ["shanghai"], latitude: 31.2304, longitude: 121.4737, timezone: "Asia/Shanghai" },
  { id: "gb-london", countryCode: "GB", country: "영국", name: "런던", aliases: ["london"], latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
  { id: "fr-paris", countryCode: "FR", country: "프랑스", name: "파리", aliases: ["paris"], latitude: 48.8566, longitude: 2.3522, timezone: "Europe/Paris" },
  { id: "de-berlin", countryCode: "DE", country: "독일", name: "베를린", aliases: ["berlin"], latitude: 52.52, longitude: 13.405, timezone: "Europe/Berlin" },
  { id: "au-sydney", countryCode: "AU", country: "호주", name: "시드니", aliases: ["sydney"], latitude: -33.8688, longitude: 151.2093, timezone: "Australia/Sydney" },
  { id: "sg-singapore", countryCode: "SG", country: "싱가포르", name: "싱가포르", aliases: ["singapore"], latitude: 1.3521, longitude: 103.8198, timezone: "Asia/Singapore" },
  { id: "ca-toronto", countryCode: "CA", country: "캐나다", name: "토론토", aliases: ["toronto"], latitude: 43.6532, longitude: -79.3832, timezone: "America/Toronto" },
];

export function findCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function searchCities(query: string, limit = 8): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES.filter((c) => c.countryCode === "KR").slice(0, limit);
  return CITIES.filter((c) => {
    if (c.name.includes(query.trim())) return true;
    if (c.country.includes(query.trim())) return true;
    return (c.aliases ?? []).some((a) => a.toLowerCase().includes(q));
  }).slice(0, limit);
}
