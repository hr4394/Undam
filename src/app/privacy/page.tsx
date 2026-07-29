import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <LegalPage title="개인정보처리방침">
      <h2 style={{ fontSize: 17 }}>1. 수집 항목</h2>
      <p>이름/닉네임, 성별(선택), 생년월일, 출생 시간, 출생 국가·도시, 관심 분야, 선택 입력한 고민, (선택) 이메일. 생년월일·출생 시간·출생 장소는 <strong>민감정보</strong>로 취급합니다.</p>
      <h2 style={{ fontSize: 17 }}>2. 이용 목적</h2>
      <p>사주·서양점성술 계산과 해석 리포트 생성, 결제 처리, 비공개 결과 재접속 및 (선택) 결과 링크 이메일 전송에만 사용합니다.</p>
      <h2 style={{ fontSize: 17 }}>3. 보존 기간</h2>
      <p>계산·해석·PDF 등 개인 데이터는 생성 후 <strong>{siteConfig.retentionDays}일</strong> 보관 후 자동 파기하거나, 이용자의 삭제 요청 시 즉시 파기합니다. 단, 전자상거래법 등 법령상 필요한 결제 기록은 최소한으로 분리 보존합니다.</p>
      <h2 style={{ fontSize: 17 }}>4. 이메일</h2>
      <p>이메일은 선택 사항이며 계정 생성에 사용하지 않습니다. 결과 링크 전송·구매 복구 목적에만 사용하고, 별도 동의 없이 마케팅에 사용하지 않습니다.</p>
      <h2 style={{ fontSize: 17 }}>5. 로그·분석</h2>
      <p>분석 이벤트와 서버 로그에 실명·생년월일·출생 시간·출생 장소·접근 토큰을 포함하지 않습니다.</p>
      <h2 style={{ fontSize: 17 }}>6. 삭제 요청</h2>
      <p>소유자 링크 화면의 “결과 삭제 요청” 또는 {siteConfig.contactEmail} 으로 요청할 수 있습니다. 삭제 시 출생 프로필·계산·해석·PDF·공유 링크·(선택)이메일이 삭제됩니다.</p>
    </LegalPage>
  );
}
