import type { ConfirmParams, ConfirmResult, PaymentProvider } from "./provider";

/**
 * TossPaymentsProvider (테스트 모드 기본).
 * 결제 승인은 서버에서 Toss 의 /v1/payments/confirm 을 호출해 최종 검증한다.
 * providerPayload 에는 클라이언트 위젯이 반환한 paymentKey/orderId/amount 가 담긴다.
 *
 * 문서: https://docs.tosspayments.com/reference (Confirm Payment)
 * 최소 결제금액/수단 정책은 출시 전 공식 문서로 재확인해야 한다(README TODO 참조).
 */
export class TossPaymentsProvider implements PaymentProvider {
  readonly name = "toss";
  constructor(private secretKey: string) {}

  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    const paymentKey = String(params.providerPayload?.paymentKey ?? "");
    const tossOrderId = String(params.providerPayload?.orderId ?? "");
    const amount = Number(params.providerPayload?.amount ?? 0);

    // 서버에서 금액 재확인 (클라이언트 금액 신뢰 금지)
    if (amount !== params.expectedAmount) {
      return {
        approved: false,
        approvedAt: new Date().toISOString(),
        message: "금액 검증 실패",
      };
    }
    if (!paymentKey || !tossOrderId) {
      return {
        approved: false,
        approvedAt: new Date().toISOString(),
        message: "결제 파라미터 누락",
      };
    }

    const auth = Buffer.from(`${this.secretKey}:`).toString("base64");
    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId: tossOrderId,
        amount: params.expectedAmount,
      }),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return {
        approved: false,
        approvedAt: new Date().toISOString(),
        message: err.message ?? `Toss 승인 실패 (${res.status})`,
      };
    }

    const data = (await res.json()) as {
      paymentKey: string;
      totalAmount: number;
      approvedAt: string;
      status: string;
    };
    // 최종 금액/상태 재검증
    if (data.totalAmount !== params.expectedAmount || data.status !== "DONE") {
      return {
        approved: false,
        approvedAt: new Date().toISOString(),
        message: "승인 응답 검증 실패",
      };
    }
    return {
      approved: true,
      providerPaymentKey: data.paymentKey,
      approvedAt: data.approvedAt ?? new Date().toISOString(),
    };
  }
}
