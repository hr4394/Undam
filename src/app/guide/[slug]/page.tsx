import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDE_ARTICLES, getArticle } from "@/content/guide";
import { SiteFooter } from "@/components/site-footer";

export function generateStaticParams() {
  return GUIDE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return { title: "가이드" };
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `/guide/${a.slug}` },
    openGraph: { title: a.title, description: a.description, type: "article" },
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
  };
  if (article.faq?.length) {
    jsonLd.mainEntity = article.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    }));
    jsonLd["@type"] = ["Article", "FAQPage"];
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="container-m" style={{ paddingTop: 24 }}>
        <Link href="/guide" className="btn-ghost" style={{ padding: 0, fontSize: 14 }}>← 가이드 목록</Link>
        <h1 style={{ fontSize: 25, marginTop: 12 }}>{article.title}</h1>
        <p style={{ color: "var(--text-secondary)" }}>{article.description}</p>
        <div className="card" style={{ padding: 18, marginTop: 12 }}>
          {article.body.map((s, i) => (
            <section key={i} style={{ marginBottom: i < article.body.length - 1 ? 16 : 0 }}>
              <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{s.h}</h2>
              <p style={{ margin: 0, lineHeight: 1.8 }}>{s.p}</p>
            </section>
          ))}
        </div>
        {article.faq?.length ? (
          <div className="card" style={{ padding: 18, marginTop: 12 }}>
            <h2 style={{ fontSize: 18, marginTop: 0 }}>자주 묻는 질문</h2>
            {article.faq.map((f, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontWeight: 600, margin: "0 0 2px" }}>Q. {f.q}</p>
                <p style={{ margin: 0, color: "var(--text-secondary)" }}>A. {f.a}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ marginTop: 20 }}>
          <Link href="/start" className="btn btn-gold" style={{ width: "100%", maxWidth: 320 }}>무료로 내 리포트 시작하기</Link>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
