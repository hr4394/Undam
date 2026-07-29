# 운담 · Render(Docker) 배포용 이미지
# - Playwright chromium + 한글 폰트(Noto CJK) 포함 → PDF 정상 생성
# - 컨테이너 시작 시 prisma migrate + seed 실행 후 Next 서버 기동
FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
# Next 텔레메트리 비활성화
ENV NEXT_TELEMETRY_DISABLED=1

# 시스템 패키지: prisma(openssl), 한글 폰트(Noto CJK)
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl ca-certificates fonts-noto-cjk fonts-noto-cjk-extra \
  && rm -rf /var/lib/apt/lists/*

# 의존성 설치 (빌드에 devDependencies 필요 → 포함 설치)
COPY package*.json ./
RUN npm ci --include=dev

# 소스 복사
COPY . .

# Prisma 클라이언트 생성 (현재 이미지 OS 기준 엔진)
RUN npx prisma generate

# Playwright chromium + OS 의존성 설치(root 빌드 단계)
RUN npx playwright install --with-deps chromium

# 프로덕션 빌드
RUN npm run build

EXPOSE 3000

# 시작: DB가 켜질 때까지 최대 ~90초 재시도하며 마이그레이션 → 시드 → Next 서버
# (무료 DB 최초 프로비저닝 지연/타이밍으로 인한 P1001 방지. 끝내 실패해도 서버는 기동)
CMD ["sh", "-c", "for i in $(seq 1 15); do npx prisma migrate deploy && break || { echo \"DB 준비 대기중... ($i/15)\"; sleep 6; }; done; (npm run seed || echo 'seed skipped'); npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
