/**
 * 사이트 전역 설정 (브랜드/연락처/정책).
 * 값은 환경변수로 덮어쓸 수 있으며, 하드코딩을 피하기 위해 여기서 일원화한다.
 */

export const siteConfig = {
  brand: process.env.NEXT_PUBLIC_BRAND_NAME ?? "운담",
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ??
    "동양의 사주와 서양의 별자리로 읽는 나의 두 가지 운명 지도",
  subCopy:
    "서로 다른 두 관점이 공통으로 발견한 나의 성향과 반복되는 패턴을 확인해 보세요.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "help@undam.example",
  contactBusiness:
    process.env.NEXT_PUBLIC_CONTACT_BUSINESS ?? "운담 (사업자정보 미입력)",
  // 개인정보 보존 기간(일). 서버에서만 신뢰.
  retentionDays: Number(process.env.PERSONAL_DATA_RETENTION_DAYS ?? "180"),
  draftTtlMinutes: Number(process.env.DRAFT_TTL_MINUTES ?? "120"),
  // 무료 모드: 결제 없이 전체 리포트를 무료로 제공(기본 활성).
  // 유료로 전환하려면 NEXT_PUBLIC_FREE_MODE="false" 로 설정.
  freeMode: process.env.NEXT_PUBLIC_FREE_MODE !== "false",
} as const;

export type SiteConfig = typeof siteConfig;
