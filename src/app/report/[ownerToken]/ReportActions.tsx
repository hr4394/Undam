"use client";

import { useState, useTransition } from "react";
import { createShareLinkAction, deleteReportAction } from "@/app/actions";

export function ReportActions({ ownerToken }: { ownerToken: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copyOwnerLink() {
    const url = `${window.location.origin}/report/${ownerToken}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "운담 리포트", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {}
  }

  function makeShare() {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ownerToken", ownerToken);
      const res = await createShareLinkAction(fd);
      if (res.ok) {
        setShareUrl(`${window.location.origin}/share/${res.shareToken}`);
      } else {
        setMsg(res.error);
      }
    });
  }

  async function copyShare() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function confirmDelete() {
    if (!window.confirm("결과를 삭제하면 이 링크와 공유 링크 모두 접근할 수 없습니다. 삭제할까요?\n(계산·해석·PDF·공유링크가 삭제되며, 법정 결제기록만 최소 보존됩니다)")) return;
    const fd = new FormData();
    fd.set("ownerToken", ownerToken);
    startTransition(() => deleteReportAction(fd));
  }

  return (
    <>
      <div className="container-m" style={{ marginTop: 8 }}>
        <div className="card" style={{ padding: 16 }}>
          <p className="label" style={{ marginBottom: 8 }}>이 결과 관리</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.7 }}>
            회원가입 없이 발급된 비공개 결과입니다. 링크를 잃어버리면 다시 찾기 어려우니 저장해 주세요.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            <button className="btn btn-outline" onClick={makeShare} disabled={pending}>
              공유 링크 만들기 (읽기 전용)
            </button>
            {shareUrl && (
              <div className="card" style={{ padding: 10, background: "var(--background)" }}>
                <p style={{ fontSize: 12, wordBreak: "break-all", margin: "0 0 6px" }}>{shareUrl}</p>
                <button className="btn btn-ghost" style={{ minHeight: 40 }} onClick={copyShare}>공유 링크 복사</button>
              </div>
            )}
            <button className="btn btn-ghost" style={{ minHeight: 44, justifyContent: "flex-start", color: "var(--accent-red)" }} onClick={confirmDelete} disabled={pending}>
              결과 삭제 요청
            </button>
          </div>
          {msg && <p role="alert" style={{ color: "var(--accent-red)", fontSize: 13, marginTop: 8 }}>{msg}</p>}
          {copied && <p role="status" style={{ color: "#2f6b3a", fontSize: 13, marginTop: 8 }}>복사되었습니다.</p>}
        </div>
      </div>

      <div className="sticky-bar">
        <div className="container-m" style={{ padding: 0, display: "flex", gap: 10 }}>
          <a className="btn btn-outline" style={{ flex: 1 }} href={`/api/pdf/${ownerToken}`}>
            PDF로 저장
          </a>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={copyOwnerLink}>
            링크 공유
          </button>
        </div>
      </div>
    </>
  );
}
