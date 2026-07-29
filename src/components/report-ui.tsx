import type { AccuracyGrade } from "@/domain/types";
import { ACCURACY_LABEL } from "@/domain/accuracy";

const ELEMENT_COLOR: Record<string, string> = {
  "목(木)": "#4b8b5a", "화(火)": "#c0564d", "토(土)": "#b8924a",
  "금(金)": "#9aa0a6", "수(水)": "#41618c",
  불: "#c0564d", 흙: "#b8924a", 공기: "#7c8aa5", 물: "#41618c",
};

export function AccuracyBadge({ grade }: { grade: AccuracyGrade }) {
  const cls = grade === "A" ? "badge-a" : grade === "B" ? "badge-b" : "badge-c";
  return (
    <span className={`badge ${cls}`}>
      <span aria-hidden>●</span>
      {ACCURACY_LABEL[grade]}
    </span>
  );
}

/** 오행/원소 분포 막대 차트 (텍스트+수치 포함, 차트 라이브러리 없음) */
export function DistributionBars({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return (
    <div>
      <p className="label" style={{ marginBottom: 10 }}>
        {title}
      </p>
      <ul style={{ display: "grid", gap: 10 }}>
        {Object.entries(counts).map(([k, v]) => {
          const pct = Math.round((v / total) * 100);
          return (
            <li key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 52, fontSize: 14, fontWeight: 600 }}>{k}</span>
              <span
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 999,
                  background: "rgba(35,39,54,0.08)",
                  overflow: "hidden",
                }}
                aria-hidden
              >
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${Math.max(pct, 3)}%`,
                    background: ELEMENT_COLOR[k] ?? "var(--secondary)",
                    borderRadius: 999,
                  }}
                />
              </span>
              <span style={{ width: 64, fontSize: 13, color: "var(--text-secondary)", textAlign: "right" }}>
                {v}개 · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function KeywordChips({ keywords }: { keywords: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {keywords.map((k) => (
        <span key={k} className="chip">
          #{k}
        </span>
      ))}
    </div>
  );
}

export function SectionCard({
  id,
  title,
  children,
}: {
  id?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="card" style={{ padding: 18, scrollMarginTop: 72 }}>
      {title && (
        <h2 style={{ fontSize: 18, marginBottom: 10, marginTop: 0 }}>{title}</h2>
      )}
      {children}
    </section>
  );
}
