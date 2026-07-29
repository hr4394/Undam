// 가상 인물 샘플 PDF 생성. 개발 서버(localhost:3000)가 떠 있어야 한다.
// 사용법: npm run dev (다른 터미널) → node scripts/generate-sample-pdf.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
mkdirSync("samples", { recursive: true });

const res = await fetch(`${BASE}/api/sample-pdf`);
if (!res.ok) {
  console.error("실패:", res.status, await res.text());
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
const path = "samples/sample_report.pdf";
writeFileSync(path, buf);
console.log(`저장됨: ${path} (${buf.length} bytes)`);
