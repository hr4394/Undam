import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "환불정책" };

export default function RefundPage() {
  return (
    <LegalPage title="환불정책">
      <p>본 서비스의 전체 리포트는 결제 즉시 생성·제공되는 <strong>디지털 콘텐츠</strong>입니다.</p>
      <h2 style={{ fontSize: 17 }}>1. 청약철회 제한</h2>
      <p>「전자상거래 등에서의 소비자보호에 관한 법률」에 따라, 이용자가 즉시 제공에 동의하고 콘텐츠 열람이 시작된 경우 청약철회가 제한될 수 있습니다. 결제 화면에서 이를 명확히 안내합니다.</p>
      <h2 style={{ fontSize: 17 }}>2. 환불 가능한 경우</h2>
      <ul>
        <li>결제는 완료되었으나 리포트가 생성되지 않은 경우(생성 실패)</li>
        <li>동일 결과에 중복 결제가 발생한 경우</li>
        <li>서비스 오류로 콘텐츠를 정상적으로 열람하지 못한 경우</li>
      </ul>
      <h2 style={{ fontSize: 17 }}>3. 신청 방법</h2>
      <p>{siteConfig.contactEmail} 으로 결제 일시와 상황을 알려주시면 확인 후 처리합니다.</p>
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        ※ 실제 최소 결제금액·수단·청약철회 조건은 결제대행사(Toss Payments) 및 관련 법령 기준으로 출시 전 재확인이 필요합니다.
      </p>
    </LegalPage>
  );
}
