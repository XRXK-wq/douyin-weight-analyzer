import { NextResponse } from "next/server";
import { createAnalysisReport } from "@/lib/analyzer";
import { collectPublicDouyinAccount } from "@/lib/collector";
import { getReport, saveUpdatedReport } from "@/lib/store";

export async function POST(request: Request) {
  const payload = (await request.json()) as { reportId: string; benchmarkProfileUrls: string[] };
  const report = getReport(payload.reportId);

  if (!report) {
    return NextResponse.json({ message: "报告不存在或已过期" }, { status: 404 });
  }

  const benchmarks = await Promise.all((payload.benchmarkProfileUrls ?? []).slice(0, 10).map((url) => collectPublicDouyinAccount(url)));
  const updated = { ...createAnalysisReport(report.target, benchmarks), id: report.id };

  return NextResponse.json(saveUpdatedReport(updated));
}
