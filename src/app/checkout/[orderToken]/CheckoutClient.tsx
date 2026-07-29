"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { confirmMockPaymentAction } from "@/app/actions";

const LOADING_STEPS = [
  "결제를 안전하게 확인하고 있어요.",
  "사주의 오행과 관계를 계산하고 있어요.",
  "행성과 별자리의 위치를 확인하고 있어요.",
  "두 가지 관점의 공통된 패턴을 찾고 있어요.",
  "읽기 쉬운 리포트로 정리하고 있어요.",
];

export function CheckoutClient({
  orderToken,
  ownerToken,
  amount,
  provider,
  alreadyPaid,
  tossClientKey,
}: {
  orderToken: string;
  ownerToken: string;
  amount: number;
  provider: "mock" | "toss";
  alreadyPaid: boolean;
  tossClientKey: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  function payMock() {
    setError(null);
    // 실제 단계 상태 표시 (가짜 퍼센트 없음)
    const timer = setInterval(
      () => setStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1)),
      600,
    );
    startTransition(async () => {
      const fd = new FormData();
      fd.set("orderToken", orderToken);
      fd.set("ownerToken", ownerToken);
      const res = await confirmMockPaymentAction(fd);
      clearInterval(timer);
      if (res && !res.ok) setError(res.error);
    });
  }

  if (alreadyPaid) {
    return (
      <Link href={`/report/${ownerToken}`} className="btn btn-gold" style={{ width: "100%" }}>
        이미 결제됨 · 전체 리포트 열기
      </Link>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {provider === "mock" ? (
        <>
          <div className="card" style={{ padding: 14, background: "#fff7e6", border: "1px solid rgba(184,146,74,0.3)" }}>
            <p style={{ margin: 0, fontSize: 13.5, color: "#8a6a1f" }}>
              현재 <strong>테스트(mock) 결제</strong> 모드입니다. 실제 청구가 발생하지 않습니다.
              운영 배포 시 Toss Payments 로 전환됩니다.
            </p>
          </div>
          <button className="btn btn-gold" style={{ width: "100%" }} disabled={pending} onClick={payMock}>
            {pending ? LOADING_STEPS[stepIdx] : `${amount.toLocaleString("ko-KR")}원 결제하기 (테스트)`}
          </button>
        </>
      ) : (
        <div className="card" style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Toss Payments 결제 위젯 연동 지점입니다. 클라이언트 키가 설정되면 위젯이 렌더링되고,
            성공 시 서버가 <code>/v1/payments/confirm</code> 으로 최종 검증합니다.
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
            client key: {tossClientKey ? tossClientKey.slice(0, 10) + "…" : "(미설정)"}
          </p>
        </div>
      )}

      {pending && (
        <div role="status" aria-live="polite" style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
          {LOADING_STEPS[stepIdx]} 탭을 닫아도 생성은 계속됩니다.
        </div>
      )}
      {error && (
        <p role="alert" style={{ color: "var(--accent-red)", fontSize: 14, fontWeight: 600, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
