"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { birthInputSchema } from "@/server/validation";
import {
  createReport,
  createOrderForReport,
  confirmPaymentAndGenerate,
  enableShare,
  deleteReport,
} from "@/server/services/report";
import { getStore } from "@/server/store";
import { PRIMARY_PRODUCT_ID } from "@/config/products";
import type { BirthInput } from "@/domain/types";

/** 출생 입력 제출 → 계산 → 무료 미리보기로 이동 */
export async function submitBirthAction(input: BirthInput): Promise<
  { ok: false; error: string } | never
> {
  const parsed = birthInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "입력 오류" };
  }
  const { ownerToken } = await createReport(parsed.data as BirthInput);
  redirect(`/preview/${ownerToken}`);
}

/** 미리보기에서 결제 시작 → 주문 생성 → 결제 페이지로 이동 */
export async function startCheckoutAction(formData: FormData): Promise<void> {
  const ownerToken = String(formData.get("ownerToken") ?? "");
  const store = getStore();
  const report = await store.findReportByOwnerToken(ownerToken);
  if (!report) redirect("/start");

  // idempotencyKey 는 (리포트 + 상품) 기준으로 안정적으로 생성해 중복 주문 방지
  const idem = `rep:${report.id}:prod:${PRIMARY_PRODUCT_ID}`;
  const existing = await store.findOrderByIdempotencyKey(idem);
  if (existing && existing.status !== "canceled") {
    // 이미 미완료 주문이 있으면 그 주문으로 이동(새 토큰 없이 재사용 불가하므로 새로 만들되 키 재활용)
  }
  const { orderToken } = await createOrderForReport(
    report.id,
    PRIMARY_PRODUCT_ID,
    `${idem}:${randomUUID().slice(0, 8)}`,
  );
  redirect(`/checkout/${orderToken}?o=${ownerToken}`);
}

/** 결제 승인(mock) + 리포트 생성 → 결과 페이지로 이동 */
export async function confirmMockPaymentAction(formData: FormData): Promise<
  { ok: false; error: string } | never
> {
  const orderToken = String(formData.get("orderToken") ?? "");
  const ownerToken = String(formData.get("ownerToken") ?? "");
  const store = getStore();
  const order = await store.findOrderByToken(orderToken);
  if (!order) return { ok: false, error: "주문을 찾을 수 없습니다." };

  const result = await confirmPaymentAndGenerate(order.id, {
    amount: order.amount,
  });
  if (!result.ok) {
    return { ok: false, error: result.message ?? "결제/생성 실패" };
  }
  redirect(`/report/${ownerToken}`);
}

/** 공유 링크 생성 */
export async function createShareLinkAction(formData: FormData): Promise<
  { ok: true; shareToken: string } | { ok: false; error: string }
> {
  const ownerToken = String(formData.get("ownerToken") ?? "");
  const store = getStore();
  const report = await store.findReportByOwnerToken(ownerToken);
  if (!report || report.status !== "completed") {
    return { ok: false, error: "완료된 리포트에서만 공유할 수 있습니다." };
  }
  const shareToken = await enableShare(report.id);
  return { ok: true, shareToken };
}

/** 결과(개인정보) 삭제 요청 */
export async function deleteReportAction(formData: FormData): Promise<void> {
  const ownerToken = String(formData.get("ownerToken") ?? "");
  const store = getStore();
  const report = await store.findReportByOwnerToken(ownerToken);
  if (report) await deleteReport(report.id);
  redirect("/?deleted=1");
}
