import { NextResponse } from "next/server";
import { getJob } from "@/lib/store";

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ message: "任务不存在或已过期" }, { status: 404 });
  }

  return NextResponse.json(job);
}
