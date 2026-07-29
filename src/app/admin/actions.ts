"use server";

import { redirect } from "next/navigation";
import { checkAdminPassword, setAdminCookie } from "@/server/admin";
import { generateSynthesisForReport } from "@/server/services/report";
import { getStore } from "@/server/store";

export async function adminLoginAction(formData: FormData): Promise<void> {
  const pw = String(formData.get("password") ?? "");
  if (!checkAdminPassword(pw)) {
    redirect("/admin?error=1");
  }
  await setAdminCookie();
  redirect("/admin");
}

/** 실패한 리포트 재처리 */
export async function adminRetryReportAction(formData: FormData): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const store = getStore();
  const report = await store.getReportById(reportId);
  if (report && (report.status === "failed" || report.status === "generating")) {
    try {
      await generateSynthesisForReport(reportId);
      // 관련 주문도 fulfilled 로
      const orders = await store.listOrders();
      const ord = orders.find((o) => o.reportId === reportId);
      if (ord) await store.updateOrder(ord.id, { status: "fulfilled" });
    } catch {
      // 유지: failed
    }
  }
  redirect("/admin");
}
