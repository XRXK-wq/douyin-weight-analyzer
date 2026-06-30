import { NextResponse } from "next/server";
import { getReport } from "@/lib/store";

export async function GET(_: Request, context: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await context.params;
  const report = getReport(reportId);

  if (!report) {
    return NextResponse.json({ message: "报告不存在或已过期" }, { status: 404 });
  }

  return NextResponse.json(report);
}
