import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_ARTICLES } from "@/content/guide";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "가이드",
  description: "사주와 서양점성술을 이해하고 건강하게 활용하는 데 도움이 되는 글 모음입니다.",
  alternates: { canonical: "/guide" },
};

export default function GuideListPage() {
  return (
    <main>
      <div className="container-m" style={{ paddingTop: 24 }}>
        <Link href="/" className="btn-ghost" style={{ padding: 0, fontSize: 14 }}>← 처음으로</Link>
        <h1 style={{ fontSize: 26, marginTop: 12 }}>가이드</h1>
        <p style={{ color: "var(--text-secondary)" }}>사주와 서양점성술을 이해하는 데 도움이 되는 글.</p>
        <ul style={{ display: "grid", gap: 12, margin: "16px 0 0", padding: 0, listStyle: "none" }}>
          {GUIDE_ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link href={`/guide/${a.slug}`} className="card" style={{ display: "block", padding: 16, textDecoration: "none", color: "inherit" }}>
                <h2 style={{ fontSize: 17, margin: "0 0 6px" }}>{a.title}</h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>{a.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <SiteFooter />
    </main>
  );
}
