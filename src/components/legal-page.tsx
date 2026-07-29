import Link from "next/link";
import { SiteFooter } from "./site-footer";

export function LegalPage({
  title,
  updated = "2026-07-29",
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <div className="container-m" style={{ paddingTop: 20 }}>
        <Link href="/" className="btn-ghost" style={{ padding: 0, fontSize: 14 }}>← 처음으로</Link>
        <h1 style={{ fontSize: 24, marginTop: 12 }}>{title}</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>최종 업데이트: {updated}</p>
        <div className="card" style={{ padding: 18, marginTop: 12, fontSize: 15, lineHeight: 1.8 }}>
          {children}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 16, lineHeight: 1.7 }}>
          본 문서는 서비스 이해를 돕기 위한 안내이며 법적으로 완결된 문서임을 보장하지 않습니다.
          실제 출시 전 전문가 검토가 필요합니다.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
