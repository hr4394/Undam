import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        marginTop: 32,
        padding: "24px 0 40px",
      }}
    >
      <div className="container-m" style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        <p style={{ marginBottom: 12, lineHeight: 1.7 }}>
          {siteConfig.brand}의 해석은 <strong>자기이해와 오락을 위한 참고 콘텐츠</strong>입니다.
          미래를 보장하지 않으며 의료·법률·투자·심리상담을 대체하지 않습니다.
        </p>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", marginBottom: 12 }}>
          <Link href="/guide">가이드</Link>
          <Link href="/sample">샘플 리포트</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/refund">환불정책</Link>
          <Link href="/disclaimer">면책 고지</Link>
          <Link href="/contact">문의</Link>
        </nav>
        <p>
          {siteConfig.contactBusiness} · 문의 {siteConfig.contactEmail}
        </p>
      </div>
    </footer>
  );
}
