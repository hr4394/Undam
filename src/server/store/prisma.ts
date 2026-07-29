import { PrismaClient } from "@prisma/client";
import { hashToken } from "@/lib/tokens";
import type {
  AiUsageRecord,
  OrderRecord,
  ReportRecord,
  Store,
} from "./types";

/**
 * 운영용 PostgreSQL 저장소(Prisma).
 * - 접근 토큰은 해시 컬럼으로 O(1) 조회(원문 미저장).
 * - ReportRecord/OrderRecord 는 snapshotJson 으로 무결하게 round-trip 한다.
 * - schema.prisma 의 관계형 테이블은 데이터 모델 설계(질의/감사용)로 함께 유지된다.
 *
 * 활성화: DATABASE_URL 설정 → `prisma migrate deploy` → src/server/store/index.ts 에서 선택.
 */
export class PrismaStore implements Store {
  constructor(private db: PrismaClient = new PrismaClient()) {}

  async createReport(r: ReportRecord): Promise<void> {
    await this.db.synthesisReport.create({
      data: {
        id: r.id,
        status: r.status,
        freePreviewJson: r.freePreview as object,
        synthesisJson: (r.synthesis ?? null) as object,
        snapshotJson: r as unknown as object,
        ownerTokenHash: r.ownerTokenHash,
        shareTokenHash: r.shareTokenHash ?? null,
        shareEnabled: r.shareEnabled,
        accuracyGrade: r.accuracyGrade,
        calcVersion: r.calcVersion,
        promptVersion: r.promptVersion ?? null,
        aiProvider: r.ai?.provider ?? null,
        aiModel: r.ai?.model ?? null,
        aiCostKrw: r.ai?.costKrw ?? null,
      },
    });
  }

  private toRecord(row: { snapshotJson: unknown } | null): ReportRecord | null {
    if (!row) return null;
    return row.snapshotJson as ReportRecord;
  }

  async getReportById(id: string): Promise<ReportRecord | null> {
    const row = await this.db.synthesisReport.findFirst({ where: { id, deletedAt: null } });
    return this.toRecord(row);
  }

  async findReportByOwnerToken(token: string): Promise<ReportRecord | null> {
    const row = await this.db.synthesisReport.findFirst({
      where: { ownerTokenHash: hashToken(token), deletedAt: null },
    });
    return this.toRecord(row);
  }

  async findReportByShareToken(token: string): Promise<ReportRecord | null> {
    const row = await this.db.synthesisReport.findFirst({
      where: { shareTokenHash: hashToken(token), shareEnabled: true, deletedAt: null },
    });
    return this.toRecord(row);
  }

  async updateReport(id: string, patch: Partial<ReportRecord>): Promise<ReportRecord> {
    const current = await this.getReportById(id);
    if (!current) throw new Error("report not found");
    const merged: ReportRecord = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await this.db.synthesisReport.update({
      where: { id },
      data: {
        status: merged.status,
        synthesisJson: (merged.synthesis ?? null) as object,
        snapshotJson: merged as unknown as object,
        shareTokenHash: merged.shareTokenHash ?? null,
        shareEnabled: merged.shareEnabled,
        promptVersion: merged.promptVersion ?? null,
        aiProvider: merged.ai?.provider ?? null,
        aiModel: merged.ai?.model ?? null,
        aiCostKrw: merged.ai?.costKrw ?? null,
      },
    });
    return merged;
  }

  async deleteReportData(id: string): Promise<void> {
    // 민감정보 스냅샷/토큰 제거, 결제 기록(Order)은 별도 최소 보존.
    await this.db.synthesisReport.update({
      where: { id },
      data: {
        status: "refunded",
        deletedAt: new Date(),
        synthesisJson: undefined,
        snapshotJson: { deleted: true } as object,
        shareEnabled: false,
        shareTokenHash: null,
      },
    });
  }

  async createOrder(o: OrderRecord): Promise<void> {
    await this.db.order.create({
      data: {
        id: o.id,
        productId: o.productId,
        reportId: o.reportId,
        amount: o.amount,
        status: o.status,
        idempotencyKey: o.idempotencyKey,
        orderTokenHash: o.orderTokenHash,
        snapshotJson: o as unknown as object,
      },
    });
  }

  private toOrder(row: { snapshotJson: unknown } | null): OrderRecord | null {
    if (!row) return null;
    return row.snapshotJson as OrderRecord;
  }

  async getOrderById(id: string): Promise<OrderRecord | null> {
    return this.toOrder(await this.db.order.findUnique({ where: { id } }));
  }

  async findOrderByToken(token: string): Promise<OrderRecord | null> {
    return this.toOrder(
      await this.db.order.findUnique({ where: { orderTokenHash: hashToken(token) } }),
    );
  }

  async findOrderByIdempotencyKey(key: string): Promise<OrderRecord | null> {
    return this.toOrder(await this.db.order.findUnique({ where: { idempotencyKey: key } }));
  }

  async updateOrder(id: string, patch: Partial<OrderRecord>): Promise<OrderRecord> {
    const current = await this.getOrderById(id);
    if (!current) throw new Error("order not found");
    const merged: OrderRecord = { ...current, ...patch, updatedAt: new Date().toISOString() };
    await this.db.order.update({
      where: { id },
      data: { status: merged.status, snapshotJson: merged as unknown as object },
    });
    return merged;
  }

  async recordAiUsage(u: AiUsageRecord): Promise<void> {
    await this.db.aiUsage.create({
      data: {
        id: u.id,
        reportId: u.reportId,
        provider: u.provider,
        model: u.model,
        inputTokens: u.inputTokens,
        outputTokens: u.outputTokens,
        costKrw: u.costKrw,
        latencyMs: u.latencyMs,
      },
    });
  }

  async listOrders(): Promise<OrderRecord[]> {
    const rows = await this.db.order.findMany();
    return rows.map((r) => r.snapshotJson as unknown as OrderRecord);
  }
  async listReports(): Promise<ReportRecord[]> {
    const rows = await this.db.synthesisReport.findMany({ where: { deletedAt: null } });
    return rows.map((r) => r.snapshotJson as unknown as ReportRecord);
  }
  async listAiUsage(): Promise<AiUsageRecord[]> {
    const rows = await this.db.aiUsage.findMany();
    return rows.map((r) => ({
      id: r.id,
      reportId: r.reportId ?? undefined,
      provider: r.provider,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      costKrw: r.costKrw,
      latencyMs: r.latencyMs,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
