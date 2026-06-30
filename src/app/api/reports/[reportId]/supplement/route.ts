import { NextResponse } from "next/server";
import { createAnalysisReport } from "@/lib/analyzer";
import { getReport, saveUpdatedReport } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await context.params;
  const report = getReport(reportId);

  if (!report) {
    return NextResponse.json({ message: "报告不存在或已过期" }, { status: 404 });
  }

  const payload = (await request.json()) as { views?: number[]; favorites?: number[]; shares?: number[] };
  const target = {
    ...report.target,
    videos: report.target.videos.map((video, index) => ({
      ...video,
      views: payload.views?.[index] ?? video.views,
      favorites: payload.favorites?.[index] ?? video.favorites,
      shares: payload.shares?.[index] ?? video.shares
    })),
    missingFields: []
  };
  const updated = { ...createAnalysisReport(target, report.benchmarks), id: report.id };

  return NextResponse.json(saveUpdatedReport(updated));
}
