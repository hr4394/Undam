import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "이용약관" };

export default function TermsPage() {
  return (
    <LegalPage title="이용약관">
      <h2 style={{ fontSize: 17 }}>1. 서비스 성격</h2>
      <p>{siteConfig.brand}은 사주와 서양점성술을 계산·해석해 제공하는 <strong>자기이해·오락용 참고 콘텐츠</strong>입니다. 과학적으로 검증된 미래 예측이 아니며, 의료·법률·투자·심리상담을 대체하지 않습니다.</p>
      <h2 style={{ fontSize: 17 }}>2. 이용 자격</h2>
      <p>만 14세 이상 이용을 원칙으로 합니다.</p>
      <h2 style={{ fontSize: 17 }}>3. 결제와 콘텐츠 제공</h2>
      <p>전체 리포트는 유료(디지털 콘텐츠)이며 결제 완료 즉시 제공됩니다. 결제 금액과 포함 내용은 결제 화면에 명시됩니다.</p>
      <h2 style={{ fontSize: 17 }}>4. 금지 사항</h2>
      <p>서비스의 비정상적 접근, 타인 결과 무단 열람 시도, 자동화된 대량 요청 등을 금지합니다.</p>
      <h2 style={{ fontSize: 17 }}>5. 책임의 한계</h2>
      <p>이용자는 리포트를 참고 자료로만 활용해야 하며, 중요한 결정의 유일한 근거로 사용해서는 안 됩니다.</p>
      <h2 style={{ fontSize: 17 }}>6. 문의</h2>
      <p>{siteConfig.contactEmail}</p>
    </LegalPage>
  );
}
