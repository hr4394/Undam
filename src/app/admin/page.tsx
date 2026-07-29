import type { Metadata } from "next";
import { isAdmin } from "@/server/admin";
import { getStore } from "@/server/store";
import { adminLoginAction, adminRetryReportAction } from "./actions";

export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

// 결제 수수료율(관리자 입력 대체: 환경/기본값). 기여이익 추정에 사용.
const FEE_RATE = 0.033;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <main className="container-m" style={{ paddingTop: 60, maxWidth: 420 }}>
        <h1 style={{ fontSize: 22 }}>관리자 로그인</h1>
        {error && (
          <p role="alert" style={{ color: "var(--accent-red)", fontSize: 14, marginTop: 8 }}>
            비밀번호가 올바르지 않습니다.
          </p>
        )}
        <form action={adminLoginAction} style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input className="input" type="password" name="password" placeholder="관리자 비밀번호" autoFocus />
          <button className="btn btn-primary" type="submit">로그인</button>
        </form>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 12 }}>
          ADMIN_PASSWORD 환경변수로 설정됩니다.
        </p>
      </main>
    );
  }

  const store = getStore();
  const [orders, reports, usage] = await Promise.all([
    store.listOrders(),
    store.listReports(),
    store.listAiUsage(),
  ]);

  const paid = orders.filter((o) => o.status === "fulfilled" || o.status === "paid");
  const revenue = paid.reduce((s, o) => s + o.amount, 0);
  const totalReports = reports.filter((r) => !r.deletedAt).length;
  const previews = reports.length;
  const conversion = previews ? ((paid.length / previews) * 100).toFixed(1) : "0";
  const aiCost = usage.reduce((s, u) => s + u.costKrw, 0);
  const avgAiCost = reports.length ? aiCost / reports.length : 0;
  const fees = Math.round(revenue * FEE_RATE);
  const contribution = revenue - fees - Math.round(aiCost);
  const failed = reports.filter((r) => r.status === "failed");
  const shares = reports.filter((r) => r.shareEnabled).length;

  const stat = (label: string, value: string) => (
    <div className="card" style={{ padding: 14 }}>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, margin: "4px 0 0" }}>{value}</p>
    </div>
  );

  return (
    <main className="container-m" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <h1 style={{ fontSize: 24 }}>관리자 대시보드</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        {stat("오늘까지 매출", `${revenue.toLocaleString("ko-KR")}원`)}
        {stat("결제 전환율", `${conversion}%`)}
        {stat("완료 리포트", `${totalReports}건`)}
        {stat("미리보기(생성)", `${previews}건`)}
        {stat("리포트당 평균 AI비용", `${avgAiCost.toFixed(1)}원`)}
        {stat("결제 수수료(추정 3.3%)", `${fees.toLocaleString("ko-KR")}원`)}
        {stat("추정 기여이익", `${contribution.toLocaleString("ko-KR")}원`)}
        {stat("공유 링크 발급", `${shares}건`)}
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>실패/재처리 대상</h2>
      {failed.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>없음</p>
      ) : (
        <ul style={{ display: "grid", gap: 8, padding: 0, listStyle: "none" }}>
          {failed.map((r) => (
            <li key={r.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13 }}>{r.id} · {r.status}</span>
              <form action={adminRetryReportAction}>
                <input type="hidden" name="reportId" value={r.id} />
                <button className="btn btn-outline" style={{ minHeight: 40 }} type="submit">재처리</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>주문</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-secondary)" }}>
              <th style={{ padding: 6 }}>주문</th><th style={{ padding: 6 }}>상품</th>
              <th style={{ padding: 6 }}>금액</th><th style={{ padding: 6 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(-20).reverse().map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: 6 }}>{o.id.slice(0, 12)}</td>
                <td style={{ padding: 6 }}>{o.productId}</td>
                <td style={{ padding: 6 }}>{o.amount.toLocaleString("ko-KR")}</td>
                <td style={{ padding: 6 }}>{o.status}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 10, color: "var(--text-secondary)" }}>주문 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 16 }}>
        ※ 개인정보(이름·생년월일·출생지)는 대시보드에 표시하지 않습니다.
      </p>
    </main>
  );
}
