import type { ChartResult } from "@/domain/pipeline";
import type { FreePreview } from "@/domain/pipeline";
import type { Synthesis } from "@/domain/synthesis/schema";
import type { ProductId } from "@/config/products";

export type ReportStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed"
  | "refunded";

export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "failed"
  | "refunded"
  | "canceled";

export interface ReportRecord {
  id: string;
  status: ReportStatus;
  profile: { nickname: string; gender: string };
  /** 계산 결과(원본 출생 입력 포함 — 민감정보, 로그 금지) */
  chart: ChartResult;
  freePreview: FreePreview;
  synthesis?: Synthesis;
  accuracyGrade: string;
  calcVersion: string;
  promptVersion?: string;
  ai?: { provider: string; model: string; costKrw: number };
  ownerTokenHash: string;
  shareTokenHash?: string;
  shareEnabled: boolean;
  pdf?: { path: string; bytes: number; templateVersion: string };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface OrderRecord {
  id: string;
  orderTokenHash: string;
  reportId: string;
  productId: ProductId;
  amount: number;
  status: OrderStatus;
  idempotencyKey: string;
  payment?: {
    provider: string;
    status: "ready" | "approved" | "canceled" | "failed";
    amount: number;
    providerPaymentKey?: string;
    approvedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AiUsageRecord {
  id: string;
  reportId?: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costKrw: number;
  latencyMs: number;
  createdAt: string;
}

export interface Store {
  createReport(r: ReportRecord): Promise<void>;
  getReportById(id: string): Promise<ReportRecord | null>;
  findReportByOwnerToken(token: string): Promise<ReportRecord | null>;
  findReportByShareToken(token: string): Promise<ReportRecord | null>;
  updateReport(id: string, patch: Partial<ReportRecord>): Promise<ReportRecord>;
  deleteReportData(id: string): Promise<void>;

  createOrder(o: OrderRecord): Promise<void>;
  getOrderById(id: string): Promise<OrderRecord | null>;
  findOrderByToken(token: string): Promise<OrderRecord | null>;
  findOrderByIdempotencyKey(key: string): Promise<OrderRecord | null>;
  updateOrder(id: string, patch: Partial<OrderRecord>): Promise<OrderRecord>;

  recordAiUsage(u: AiUsageRecord): Promise<void>;

  // 관리자 통계용
  listOrders(): Promise<OrderRecord[]>;
  listReports(): Promise<ReportRecord[]>;
  listAiUsage(): Promise<AiUsageRecord[]>;
}
