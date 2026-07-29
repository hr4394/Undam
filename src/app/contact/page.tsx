import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "문의" };

export default function ContactPage() {
  return (
    <LegalPage title="문의">
      <p>서비스 이용, 결제, 환불, 개인정보 삭제 관련 문의는 아래로 연락해 주세요.</p>
      <p style={{ fontSize: 18, fontWeight: 700 }}>
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
      </p>
      <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{siteConfig.contactBusiness}</p>
    </LegalPage>
  );
}
