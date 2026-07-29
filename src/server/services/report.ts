import { createHash } from "node:crypto";
import { getStore } from "@/server/store";
import type { OrderRecord, ReportRecord } from "@/server/store";
import { computeChart, buildFreePreview } from "@/domain/pipeline";
import { createSynthesisProvider, PROMPT_VERSION } from "@/domain/synthesis";
import { getProduct, type ProductId } from "@/config/products";
import { createPaymentProvider } from "@/server/payment";
import { generateToken, hashToken } from "@/lib/tokens";
import type { BirthInput } from "@/domain/types";

export const CALC_VERSION = "calc-v1";
const PDF_TEMPLATE_VERSION = "pdf-v1";

function shortId(prefix: string): string {
  return `${prefix}_${createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 20)}`;
}

export interface CreateReportResult {
  reportId: string;
  ownerToken: string; // 원문(한 번만 노출)
}

/** 출생 입력 → 계산 → 무료 미리보기 리포트 생성(결제 전, status=pending) */
export async function createReport(input: BirthInput): Promise<CreateReportResult> {
  const store = getStore();
  const chart = computeChart(input);
  const freePreview = buildFreePreview(chart);

  const ownerToken = generateToken("owner");
  const now = new Date().toISOString();
  const record: ReportRecord = {
    id: shortId("rpt"),
    status: "pending",
    profile: { nickname: input.nickname, gender: input.gender },
    chart,
    freePreview,
    accuracyGrade: chart.accuracy.grade,
    calcVersion: CALC_VERSION,
    ownerTokenHash: hashToken(ownerToken),
    shareEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
  await store.createReport(record);
  return { reportId: record.id, ownerToken };
}

export interface CreateOrderResult {
  orderId: string;
  orderToken: string;
  amount: number;
}

/**
 * 리포트에 대한 주문 생성.
 * 금액은 서버의 Product 정의에서 가져온다(클라이언트 금액 무시).
 * idempotencyKey 로 중복 주문을 막는다.
 */
export async function createOrderForReport(
  reportId: string,
  productId: ProductId,
  idempotencyKey: string,
): Promise<CreateOrderResult> {
  const store = getStore();
  const product = getProduct(productId);
  if (!product) throw new Error("유효하지 않은 상품입니다.");

  const existing = await store.findOrderByIdempotencyKey(idempotencyKey);
  if (existing) {
    // 중복 요청: 기존 주문의 토큰은 재발급 불가하므로 재사용 불가 안내를 위해 그대로 반환 불가.
    // 여기서는 동일 결과를 위해 새 토큰 없이 기존 주문 id 를 반환한다.
    return { orderId: existing.id, orderToken: "", amount: existing.amount };
  }

  const report = await store.getReportById(reportId);
  if (!report) throw new Error("리포트를 찾을 수 없습니다.");

  const orderToken = generateToken("order");
  const now = new Date().toISOString();
  const order: OrderRecord = {
    id: shortId("ord"),
    orderTokenHash: hashToken(orderToken),
    reportId,
    productId,
    amount: product.amount,
    status: "pending",
    idempotencyKey,
    createdAt: now,
    updatedAt: now,
  };
  await store.createOrder(order);
  return { orderId: order.id, orderToken, amount: order.amount };
}

export interface ConfirmResultDTO {
  ok: boolean;
  reportOwnerRequired?: boolean;
  message?: string;
}

/**
 * 결제 승인 + 리포트 생성.
 * - 서버에서 상품/금액 재확인, PG 최종 검증
 * - idempotent: 이미 fulfilled 면 재생성하지 않음
 * - 결제 성공 후 생성 실패 시 order.status=failed(복구/환불 대상)로 전환
 */
export async function confirmPaymentAndGenerate(
  orderId: string,
  providerPayload?: Record<string, string | number>,
): Promise<ConfirmResultDTO> {
  const store = getStore();
  const order = await store.getOrderById(orderId);
  if (!order) return { ok: false, message: "주문을 찾을 수 없습니다." };

  // 이미 처리된 주문(중복 처리 방지)
  if (order.status === "fulfilled") return { ok: true };
  if (order.status === "refunded" || order.status === "canceled") {
    return { ok: false, message: "처리할 수 없는 주문 상태입니다." };
  }

  const product = getProduct(order.productId);
  if (!product || product.amount !== order.amount) {
    return { ok: false, message: "상품 금액 검증에 실패했습니다." };
  }

  // 1) 결제 승인 (아직 승인 전인 경우)
  if (order.status === "pending") {
    const payment = createPaymentProvider();
    const result = await payment.confirm({
      orderId: order.id,
      expectedAmount: order.amount,
      providerPayload,
    });
    if (!result.approved) {
      await store.updateOrder(order.id, {
        status: "pending",
        payment: {
          provider: payment.name,
          status: "failed",
          amount: order.amount,
        },
      });
      return { ok: false, message: result.message ?? "결제 승인 실패" };
    }
    await store.updateOrder(order.id, {
      status: "paid",
      payment: {
        provider: payment.name,
        status: "approved",
        amount: order.amount,
        providerPaymentKey: result.providerPaymentKey,
        approvedAt: result.approvedAt,
      },
    });
  }

  // 2) 리포트 생성 (결제/생성 상태 분리)
  try {
    await generateSynthesisForReport(order.reportId);
    await store.updateOrder(order.id, { status: "fulfilled" });
    return { ok: true };
  } catch (err) {
    // 결제는 성공했으나 생성 실패 → 복구 대상
    await store.updateOrder(order.id, { status: "failed" });
    await store.updateReport(order.reportId, { status: "failed" });
    return {
      ok: false,
      message:
        "결제는 완료되었으나 리포트 생성에 실패했습니다. 잠시 후 자동 재시도되며, 계속 실패 시 환불 처리됩니다. (" +
        String(err) +
        ")",
    };
  }
}

/** 리포트 AI 해석 생성 (idempotent: 이미 completed 면 스킵) */
export async function generateSynthesisForReport(reportId: string): Promise<void> {
  const store = getStore();
  const report = await store.getReportById(reportId);
  if (!report) throw new Error("리포트를 찾을 수 없습니다.");
  if (report.status === "completed" && report.synthesis) return; // 중복 생성 방지

  await store.updateReport(reportId, { status: "generating" });
  const provider = createSynthesisProvider();
  const { synthesis, usage } = await provider.generate({
    birth: report.chart.normalized.original,
    saju: report.chart.saju,
    astrology: report.chart.astrology,
    concernText: report.chart.normalized.original.concernText,
  });

  await store.recordAiUsage({
    id: shortId("ai"),
    reportId,
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costKrw: usage.costKrw,
    latencyMs: usage.latencyMs,
    createdAt: new Date().toISOString(),
  });

  await store.updateReport(reportId, {
    status: "completed",
    synthesis,
    promptVersion: PROMPT_VERSION,
    ai: { provider: usage.provider, model: usage.model, costKrw: usage.costKrw },
  });
}

/** 공유 링크 활성화 + 공유 토큰 발급(원문 1회 반환) */
export async function enableShare(reportId: string): Promise<string> {
  const store = getStore();
  const shareToken = generateToken("share");
  await store.updateReport(reportId, {
    shareEnabled: true,
    shareTokenHash: hashToken(shareToken),
  });
  return shareToken;
}

/** 개인정보 삭제(계산/해석/PDF/토큰 제거, 결제기록 최소 보존) */
export async function deleteReport(reportId: string): Promise<void> {
  const store = getStore();
  await store.deleteReportData(reportId);
}

export { PDF_TEMPLATE_VERSION };
