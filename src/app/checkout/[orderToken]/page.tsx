import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore } from "@/server/store";
import { getProduct } from "@/config/products";
import { getServerEnv } from "@/config/env";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "결제",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderToken: string }>;
  searchParams: Promise<{ o?: string }>;
}) {
  const { orderToken } = await params;
  const { o: ownerToken = "" } = await searchParams;
  const store = getStore();
  const order = await store.findOrderByToken(orderToken);
  if (!order) notFound();
  const product = getProduct(order.productId);
  if (!product) notFound();

  const env = getServerEnv();
  const price = order.amount.toLocaleString("ko-KR");
  const alreadyPaid = order.status === "fulfilled";

  return (
    <main style={{ paddingBottom: 40 }}>
      <header className="container-m" style={{ paddingTop: 20 }}>
        <Link href={`/preview/${ownerToken}`} className="btn-ghost" style={{ padding: 0, fontSize: 14 }}>← 미리보기로</Link>
        <h1 style={{ fontSize: 22, marginTop: 12 }}>결제</h1>
      </header>

      <div className="container-m" style={{ display: "grid", gap: 14, marginTop: 8 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 600 }}>{product.name}</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{price}원</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "8px 0 0" }}>{product.description}</p>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <p className="label" style={{ marginBottom: 8 }}>결제 전 확인 (전자상거래 고지)</p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li>실제 결제금액: {price}원 (VAT 포함)</li>
            <li>디지털 콘텐츠는 결제 완료 즉시 제공됩니다.</li>
            <li>즉시 제공 및 열람에 동의 시, 콘텐츠 특성상 청약철회가 제한될 수 있습니다.</li>
            <li><Link href="/refund">환불정책</Link> · <Link href="/terms">이용약관</Link> · <Link href="/privacy">개인정보</Link></li>
          </ul>
        </div>

        <CheckoutClient
          orderToken={orderToken}
          ownerToken={ownerToken}
          amount={order.amount}
          provider={env.PAYMENT_PROVIDER}
          alreadyPaid={alreadyPaid}
          tossClientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ""}
        />
      </div>
    </main>
  );
}
