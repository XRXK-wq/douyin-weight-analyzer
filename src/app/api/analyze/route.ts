import { NextResponse } from "next/server";
import { z } from "zod";
import { createAnalysisReport } from "@/lib/analyzer";
import { collectPublicDouyinAccount, discoverBenchmarkProfileUrls } from "@/lib/collector";
import { saveReport } from "@/lib/store";

const analyzeSchema = z.object({
  targetProfileUrl: z.string().min(1),
  benchmarkProfileUrls: z.array(z.string()).min(0).max(10).default([])
});

export async function POST(request: Request) {
  try {
    const payload = analyzeSchema.parse(await request.json());
    const target = await collectPublicDouyinAccount(payload.targetProfileUrl);
    const manualBenchmarkUrls = payload.benchmarkProfileUrls.filter(Boolean).slice(0, 10);
    const benchmarkMode = manualBenchmarkUrls.length > 0 ? "manual" : "auto";
    const benchmarkUrls = benchmarkMode === "manual" ? manualBenchmarkUrls : discoverBenchmarkProfileUrls(target, 5);
    const benchmarks = await Promise.all(benchmarkUrls.map((url) => collectPublicDouyinAccount(url)));
    const report = createAnalysisReport(target, benchmarks);
    const job = saveReport(report, benchmarkMode);

    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "分析失败";
    return NextResponse.json({ message }, { status: 400 });
  }
}
