import type { Store } from "./types";
import { MemoryStore } from "./memory";

export * from "./types";

let store: Store | null = null;

/**
 * 저장소 선택.
 * - DATABASE_URL 이 있으면 운영용 PrismaStore(PostgreSQL)를 사용해야 한다.
 *   (PrismaStore 는 schema.prisma 기반으로 동일 인터페이스를 구현한다.)
 * - 없으면 파일 기반 MemoryStore(개발/데모).
 *
 * 참고: 이 데모 환경에는 PostgreSQL 이 없어 MemoryStore 로 실행된다.
 * 운영 배포 시 PrismaStore 를 연결하려면 src/server/store/prisma.ts 를 활성화한다.
 */
export function getStore(): Store {
  if (store) return store;
  if (process.env.DATABASE_URL && process.env.USE_PRISMA_STORE === "true") {
    // 운영: PostgreSQL. 동적 require 로 개발 번들에서 Prisma 를 분리.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaStore } = require("./prisma") as typeof import("./prisma");
    store = new PrismaStore();
  } else {
    store = new MemoryStore();
  }
  return store;
}
