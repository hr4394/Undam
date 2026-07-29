import type { Metadata } from "next";
import { StartForm } from "./StartForm";

export const metadata: Metadata = {
  title: "출생 정보 입력",
  description: "이름·생년월일·출생 시간·출생지를 입력하면 무료 미리보기를 확인할 수 있습니다.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return (
    <main>
      <StartForm />
    </main>
  );
}
