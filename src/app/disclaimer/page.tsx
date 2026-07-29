import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "면책 고지" };

export default function DisclaimerPage() {
  return (
    <LegalPage title="면책 고지">
      <ul style={{ paddingLeft: 18 }}>
        <li>본 리포트는 자기이해와 오락을 위한 참고 콘텐츠입니다.</li>
        <li>미래를 보장하거나 예언하지 않습니다.</li>
        <li>의료·법률·투자·심리상담을 대체하지 않습니다.</li>
        <li>질병·사망·사고·이혼·파산 등 부정적 사건을 예언하지 않으며, 불안을 이용한 결제 유도를 하지 않습니다.</li>
        <li>중요한 결정의 유일한 근거로 사용하지 마세요.</li>
        <li>출생 시간 미상 등으로 계산에 한계가 있을 수 있으며, 리포트에 정확도와 한계를 표시합니다.</li>
        <li>미성년자는 보호자의 지도 아래 이용하시기를 권장합니다(만 14세 이상).</li>
      </ul>
    </LegalPage>
  );
}
