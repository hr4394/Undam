import { promises as fs } from "node:fs";
import path from "node:path";
import { verifyToken } from "@/lib/tokens";
import type {
  AiUsageRecord,
  OrderRecord,
  ReportRecord,
  Store,
} from "./types";

/**
 * 파일 기반 개발/데모용 저장소.
 * DATABASE_URL 이 없을 때 사용된다. 운영 환경에서는 PrismaStore(PostgreSQL)를 사용한다.
 * 단일 프로세스 가정. 동시성은 개발 수준으로만 처리한다.
 */
interface DbShape {
  reports: ReportRecord[];
  orders: OrderRecord[];
  aiUsage: AiUsageRecord[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let cache: DbShape | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function load(): Promise<DbShape> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    cache = JSON.parse(raw) as DbShape;
  } catch {
    cache = { reports: [], orders: [], aiUsage: [] };
  }
  return cache;
}

async function persist(): Promise<void> {
  const data = cache;
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  });
  return writeChain;
}

export class MemoryStore implements Store {
  async createReport(r: ReportRecord): Promise<void> {
    const db = await load();
    db.reports.push(r);
    await persist();
  }

  async getReportById(id: string): Promise<ReportRecord | null> {
    const db = await load();
    return db.reports.find((r) => r.id === id && !r.deletedAt) ?? null;
  }

  async findReportByOwnerToken(token: string): Promise<ReportRecord | null> {
    const db = await load();
    return (
      db.reports.find(
        (r) => !r.deletedAt && verifyToken(token, r.ownerTokenHash),
      ) ?? null
    );
  }

  async findReportByShareToken(token: string): Promise<ReportRecord | null> {
    const db = await load();
    return (
      db.reports.find(
        (r) =>
          !r.deletedAt &&
          r.shareEnabled &&
          r.shareTokenHash != null &&
          verifyToken(token, r.shareTokenHash),
      ) ?? null
    );
  }

  async updateReport(
    id: string,
    patch: Partial<ReportRecord>,
  ): Promise<ReportRecord> {
    const db = await load();
    const idx = db.reports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("report not found");
    db.reports[idx] = {
      ...db.reports[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await persist();
    return db.reports[idx];
  }

  async deleteReportData(id: string): Promise<void> {
    const db = await load();
    const idx = db.reports.findIndex((r) => r.id === id);
    if (idx === -1) return;
    // 민감정보(계산/해석/PDF/토큰) 삭제. 결제 기록(주문)은 최소 보존.
    const r = db.reports[idx];
    db.reports[idx] = {
      id: r.id,
      status: "refunded",
      profile: { nickname: "(삭제됨)", gender: "unspecified" },
      // 계산/해석 데이터 제거
      chart: undefined as never,
      freePreview: undefined as never,
      synthesis: undefined,
      accuracyGrade: r.accuracyGrade,
      calcVersion: r.calcVersion,
      ownerTokenHash: "",
      shareTokenHash: undefined,
      shareEnabled: false,
      pdf: undefined,
      createdAt: r.createdAt,
      updatedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(),
    };
    await persist();
  }

  async createOrder(o: OrderRecord): Promise<void> {
    const db = await load();
    db.orders.push(o);
    await persist();
  }

  async getOrderById(id: string): Promise<OrderRecord | null> {
    const db = await load();
    return db.orders.find((o) => o.id === id) ?? null;
  }

  async findOrderByToken(token: string): Promise<OrderRecord | null> {
    const db = await load();
    return db.orders.find((o) => verifyToken(token, o.orderTokenHash)) ?? null;
  }

  async findOrderByIdempotencyKey(key: string): Promise<OrderRecord | null> {
    const db = await load();
    return db.orders.find((o) => o.idempotencyKey === key) ?? null;
  }

  async updateOrder(
    id: string,
    patch: Partial<OrderRecord>,
  ): Promise<OrderRecord> {
    const db = await load();
    const idx = db.orders.findIndex((o) => o.id === id);
    if (idx === -1) throw new Error("order not found");
    db.orders[idx] = {
      ...db.orders[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await persist();
    return db.orders[idx];
  }

  async recordAiUsage(u: AiUsageRecord): Promise<void> {
    const db = await load();
    db.aiUsage.push(u);
    await persist();
  }

  async listOrders(): Promise<OrderRecord[]> {
    return (await load()).orders;
  }
  async listReports(): Promise<ReportRecord[]> {
    return (await load()).reports;
  }
  async listAiUsage(): Promise<AiUsageRecord[]> {
    return (await load()).aiUsage;
  }
}
