/**
 * PaymentProvider 인터페이스.
 * - 클라이언트가 보낸 금액을 신뢰하지 않고, 서버에서 상품/금액을 재확인한다.
 * - 결제 성공을 서버에서 최종 검증한다.
 * - 다른 제공자로 교체 가능하도록 인터페이스로 분리한다.
 */
export interface ConfirmParams {
  orderId: string;
  /** 서버가 계산한 신뢰 금액(원) */
  expectedAmount: number;
  /** 제공자별 결제 승인에 필요한 값 */
  providerPayload?: Record<string, string | number>;
}

export interface ConfirmResult {
  approved: boolean;
  providerPaymentKey?: string;
  approvedAt: string;
  message?: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** 결제 승인/검증. 실패 시 approved=false. */
  confirm(params: ConfirmParams): Promise<ConfirmResult>;
}
