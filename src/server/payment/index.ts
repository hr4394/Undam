import { getServerEnv } from "@/config/env";
import type { PaymentProvider } from "./provider";
import { MockPaymentProvider } from "./mock";
import { TossPaymentsProvider } from "./toss";

export * from "./provider";

export function createPaymentProvider(): PaymentProvider {
  const env = getServerEnv();
  if (env.PAYMENT_PROVIDER === "toss") {
    if (!env.TOSS_SECRET_KEY) throw new Error("TOSS_SECRET_KEY 가 없습니다.");
    return new TossPaymentsProvider(env.TOSS_SECRET_KEY);
  }
  // mock: 운영 환경에서는 getServerEnv() 가 이미 차단함
  return new MockPaymentProvider();
}
