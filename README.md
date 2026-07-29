# 운담 (Undam) · 사주 × 서양점성술 종합 해석

> 동양의 사주와 서양의 별자리로 읽는 나의 두 가지 운명 지도.
> 회원가입 없이 무료 미리보기 → 550원 전체 리포트 결제 → 모바일 열람 · PDF · 비공개 공유.

모바일 퍼스트 Next.js 앱입니다. **사주 원국과 출생 차트는 검증된 계산 라이브러리로 코드가 계산**하고,
**AI는 계산 결과만 해석**합니다(계산기가 아니라 해석기). 두 체계를 단순 나열하지 않고 행동 패턴 수준에서 교차 분석합니다.

---

## 핵심 기능

- 회원가입 없이 이용 · 무료 미리보기
- 사주(절기 기준 월주, 진태양시, 음력/윤달, 지장간·십성·오행/음양)
- 서양점성술(Tropical / Placidus / Geocentric, 10천체·하우스·애스펙트)
- 두 체계 교차 통찰(공통점 · 내적 긴장) + 근거·신뢰도 표시
- 550원 단건 결제(Toss 테스트 모드 / mock adapter) · 이용권 확장 가능
- 비로그인 소유자 토큰 / 별도 공유 토큰(권한 분리, 해시 저장)
- A4 인쇄용 PDF(한글 임베드) 다운로드
- 결과 삭제(개인정보 파기)
- 관리자 대시보드(매출·전환율·AI비용·재처리)
- SEO(메타/OG/sitemap/robots/FAQ 구조화 데이터) · 접근성

## 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 ·
Zod · React Hook Form · Prisma 6 + PostgreSQL(운영) · lunar-typescript(사주) ·
circular-natal-horoscope-js(점성술) · luxon(시간대) · Playwright(E2E·PDF) · Vitest(단위)

---

## 빠른 시작 (로컬)

```bash
npm install
cp .env.example .env         # 값 채우기 (아래 참고)
npx playwright install chromium   # PDF/E2E 용
npm run dev                  # http://localhost:3000
```

> 로컬/데모는 **파일 기반 저장소(MemoryStore, `.data/store.json`)** 로 즉시 동작합니다.
> PostgreSQL 없이도 전체 흐름(입력→미리보기→결제→리포트→PDF)이 작동합니다.

### 필수 환경변수(최소)

```bash
TOKEN_HASH_SECRET=<32바이트 랜덤>   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ADMIN_PASSWORD=<관리자 비밀번호>
AI_PROVIDER=mock                    # 기본: API 키 없이 동작
PAYMENT_PROVIDER=mock               # 기본: 테스트 결제
```

전체 목록은 [`.env.example`](.env.example) 참조. 모든 환경변수는 [`src/config/env.ts`](src/config/env.ts)에서 Zod로 검증됩니다.

### 브랜드·가격 변경

- 브랜드/연락처/보존기간: [`src/config/site.ts`](src/config/site.ts) + `NEXT_PUBLIC_*` 환경변수
- 가격/이용권: [`src/config/products.ts`](src/config/products.ts) (금액은 정수(원), 하드코딩 금지)
- 이용권 활성화: `ENABLE_CREDIT_PACKS=true`

---

## 데이터베이스 (운영: PostgreSQL + Prisma)

스키마: [`prisma/schema.prisma`](prisma/schema.prisma) · 초기 마이그레이션 SQL: `prisma/migrations/0001_init/`

```bash
# .env 에 DATABASE_URL 설정 후
export DATABASE_URL="postgresql://user:pass@host:5432/undam?schema=public"
npx prisma migrate deploy      # 또는 개발: npx prisma migrate dev
npm run seed                   # Product 시드(550원 등)
# 런타임에서 Prisma 사용:
export USE_PRISMA_STORE=true
```

`DATABASE_URL` + `USE_PRISMA_STORE=true` 이면 [`PrismaStore`](src/server/store/prisma.ts)가,
아니면 [`MemoryStore`](src/server/store/memory.ts)가 선택됩니다([`src/server/store/index.ts`](src/server/store/index.ts)).
두 구현 모두 동일한 `Store` 인터페이스를 따릅니다.

## 결제 (Toss Payments)

- 기본은 `PAYMENT_PROVIDER=mock`(테스트 결제, **운영 환경에서는 자동 차단**).
- 실 결제: `PAYMENT_PROVIDER=toss` + `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY`(테스트 키로 시작).
- 서버는 클라이언트 금액을 신뢰하지 않고 Product 금액으로 재계산하며, `/v1/payments/confirm` 으로 최종 검증합니다([`src/server/payment/toss.ts`](src/server/payment/toss.ts)).
- 다른 PG 교체는 `PaymentProvider` 인터페이스 구현으로 가능합니다.
- ⚠️ **550원 최소 결제금액·결제수단·청약철회 정책은 출시 전 Toss 공식 문서와 법령으로 재확인 필요**(아래 TODO).

## AI 해석 provider

- `AI_PROVIDER=mock`(기본): 계산 결과에서 결정론적으로 근거 있는 리포트 생성(API 키 불필요).
- `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`: [`src/domain/synthesis/anthropic.ts`](src/domain/synthesis/anthropic.ts). 응답을 Zod 검증하고 실패 시 제한 재시도, 계속 실패하면 결제 복구/재처리 상태로 전환.
- 비용/토큰/지연은 `AiUsage`로 기록되어 관리자에서 집계됩니다.
- 프롬프트: 사용자 고민은 **지시가 아니라 참고 데이터**로만 전달(프롬프트 인젝션 방어).

## 관리자

`/admin` → `ADMIN_PASSWORD`로 로그인(httpOnly 쿠키). 매출·전환율·리포트당 AI비용·추정 기여이익·재처리.
개인정보(이름·생년월일·출생지)는 대시보드에 노출하지 않습니다.

---

## PDF

- 서버 전용 A4 인쇄 템플릿([`src/server/pdf/template.ts`](src/server/pdf/template.ts)) → headless chromium(Playwright)으로 변환([`src/server/pdf/renderer.ts`](src/server/pdf/renderer.ts)).
- 소유자 PDF: `GET /api/pdf/[ownerToken]` — 요청마다 권한 재검증, 결제 완료 리포트만.
- Playwright는 동적 import 로 일반 페이지 번들에 포함되지 않습니다.
- **Vercel 배포 시**: 서버리스에 chromium 이 없으므로 `@sparticuz/chromium` + `playwright-core`로 교체하거나
  PDF 생성을 별도 함수/서비스로 분리하세요(README TODO).

## 테스트 · 시각 QA

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint (0 errors)
npm test              # vitest (계산/스키마/보안 25건)
npm run test:e2e      # playwright (360·390·430·768·1440 뷰포트)
npm run screenshots   # 모바일 주요 화면 + PDF 템플릿 PNG (samples/screenshots)
npm run sample:pdf    # 가상 인물 샘플 PDF (samples/sample_report.pdf) — dev 서버 필요
```

검증된 항목(발췌): 절기 월주(입춘 전후), 진태양시, 음력/윤달, 출생시간 미상 처리, 태양별자리 fixture,
상승궁/하우스, AI JSON Zod 검증, 근거 없는 응답 거부, 가격 변조 방지, 토큰 분리, 프롬프트 인젝션 방어,
가로 스크롤 없음(360px), 전체 결제 흐름, PDF 권한.

## 산출물 (samples/)

- `samples/sample_report.pdf` — 가상 인물 “이서준” 종합 리포트(4페이지, 한글 임베드)
- `samples/screenshots/` — 랜딩·입력·미리보기·결제·전체리포트·PDF 템플릿

---

## Vercel 배포

1. 이 디렉터리를 Git 저장소로 push 후 Vercel 프로젝트 연결.
2. 환경변수 설정: `TOKEN_HASH_SECRET`, `ADMIN_PASSWORD`, `DATABASE_URL`(+`USE_PRISMA_STORE=true`),
   `AI_PROVIDER=anthropic`(+키), `PAYMENT_PROVIDER=toss`(+키), `NEXT_PUBLIC_APP_URL` 등.
3. PostgreSQL(Neon/Supabase 등) 준비 후 `prisma migrate deploy` + `npm run seed`.
4. PDF는 위 “PDF · Vercel” 주의사항에 따라 chromium 대안을 구성.
5. 운영에서 `PAYMENT_PROVIDER=mock`은 자동 차단됩니다(`ALLOW_MOCK_PAYMENT_IN_PROD`로만 예외).

## 개인정보 삭제 절차

소유자 리포트 화면 → “결과 삭제 요청”, 또는 `NEXT_PUBLIC_CONTACT_EMAIL`로 요청.
삭제 시 출생 프로필·사주/점성술 계산·AI 해석·PDF·공유 링크·(선택)이메일이 파기되고,
법정 결제 기록만 최소 분리 보존됩니다. 삭제 후 소유자/공유 링크 모두 접근 불가.

---

## 알려진 계산 한계

- 신살·대운·세운 등은 정확도 검증 범위로 제한하여 기본 포함하지 않습니다.
- 일 경계(자시) 정책은 유파에 따라 달라질 수 있어 엔진 기본값을 사용하고 결과에 표기합니다.
- 진태양시 적용 여부는 `SAJU_USE_TRUE_SOLAR_TIME`로 설정, 결과에 계산 기준을 표시합니다.
- 출생 시간 미상이면 시주·상승궁·하우스를 계산하지 않고, 달 별자리 경계 모호성을 표시하며 정확도 등급을 낮춥니다.
- 도시 좌표는 대표 근사값입니다([`src/domain/location/cities.ts`](src/domain/location/cities.ts)). 정밀 지오코딩으로 대체 가능.

## 운영 전 체크리스트

- [ ] `TOKEN_HASH_SECRET`/`ADMIN_PASSWORD` 실제 강한 값으로 교체
- [ ] PostgreSQL 연결 + `USE_PRISMA_STORE=true` + 마이그레이션/시드
- [ ] Toss 실 키 연동 및 웹훅 서명 검증 구성
- [ ] PDF chromium 대안(@sparticuz/chromium) 구성
- [ ] rate limiting / 관측(observability) 도입
- [ ] 개인정보 보존기간 배치 파기 스케줄러
- [ ] 사업자 정보/약관/환불/개인정보 문구 실제 값으로 갱신

## 실제 출시 전 법률 검토 TODO

> 아래는 **전문가 검토가 필요한 항목**입니다. 본 저장소의 법률 문서는 완결성을 보장하지 않습니다.

- [ ] 전자상거래법상 디지털 콘텐츠 청약철회/환불 고지 문구 검토
- [ ] 550원 최소 결제금액·결제수단·수수료 정책을 Toss 공식 문서로 재확인
- [ ] 개인정보보호법상 민감정보(생년월일·출생시간·출생지) 처리·보존·파기 적법성 검토
- [ ] 마케팅 수신 동의(선택) 분리 및 표시 검토
- [ ] 미성년자 이용 정책(만 14세) 검토

## 프로젝트 구조

```
src/
  config/            사이트·상품·환경변수(Zod)
  domain/            순수 계산·해석(DB 비의존)
    saju/            사주 계산기(절기·진태양시·지장간·십성)
    astrology/       점성술 계산기(Tropical/Placidus)
    synthesis/       AI 해석(스키마·mock·anthropic·프롬프트·derive)
    location/ normalize.ts pipeline.ts accuracy.ts
  server/
    store/           Store 인터페이스 + MemoryStore/PrismaStore
    services/        report(생성·주문·결제확정·삭제)·sample
    payment/         PaymentProvider + mock/toss
    pdf/             인쇄 템플릿 + Playwright 렌더러
    admin.ts validation.ts
  app/               App Router 페이지 + 서버 액션 + API 라우트
  components/        UI(리포트·장식·푸터·법률)
prisma/              schema · seed · migrations
tests/               unit(vitest) · e2e(playwright)
scripts/             screenshots · generate-sample-pdf
samples/             샘플 PDF · 스크린샷
```
