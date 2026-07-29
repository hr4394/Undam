import type { ConfirmParams, ConfirmResult, PaymentProvider } from "./provider";

/**
 * MockPaymentProvider — 개발/데모용. 운영 환경에서는 env 검증에서 차단된다.
 * 승인 시 금액 일치만 확인한다(실제 PG 호출 없음).
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    const paid = Number(params.providerPayload?.amount ?? params.expectedAmount);
    if (paid !== params.expectedAmount) {
      return {
        approved: false,
        approvedAt: new Date().toISOString(),
        message: `금액 불일치: 기대 ${params.expectedAmount}, 요청 ${paid}`,
      };
    }
    return {
      approved: true,
      providerPaymentKey: `mock_${params.orderId}`,
      approvedAt: new Date().toISOString(),
    };
  }
}
