"use client";

import { useState, useTransition } from "react";
import { openFullReportFreeAction } from "@/app/actions";

const STEPS = [
  "태어난 순간의 시간과 장소를 맞추고 있어요.",
  "사주의 다섯 기운과 관계를 살펴보고 있어요.",
  "행성과 별자리의 위치를 확인하고 있어요.",
  "두 관점의 공통된 패턴을 찾고 있어요.",
  "읽기 쉬운 리포트로 정리하고 있어요.",
];

export function FreeReportButton({ ownerToken }: { ownerToken: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  function open() {
    setError(null);
    const timer = setInterval(
      () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)),
      700,
    );
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ownerToken", ownerToken);
      const res = await openFullReportFreeAction(fd);
      clearInterval(timer);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div>
      <button className="btn btn-gold" style={{ width: "100%" }} disabled={pending} onClick={open}>
        {pending ? STEPS[stepIdx] : "전체 리포트 무료로 보기"}
      </button>
      {error && (
        <p role="alert" style={{ color: "var(--accent-red)", fontSize: 13, marginTop: 8, textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}
