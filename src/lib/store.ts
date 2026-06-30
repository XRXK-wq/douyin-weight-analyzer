import { AnalyzeJob, AnalysisReport } from "./types";

type MemoryStore = {
  reports: Map<string, AnalysisReport>;
  jobs: Map<string, AnalyzeJob>;
};

const globalStore = globalThis as typeof globalThis & {
  __douyinWeightAnalyzerStore?: MemoryStore;
};

const memoryStore =
  globalStore.__douyinWeightAnalyzerStore ??
  (globalStore.__douyinWeightAnalyzerStore = {
    reports: new Map<string, AnalysisReport>(),
    jobs: new Map<string, AnalyzeJob>()
  });

export function saveReport(report: AnalysisReport, benchmarkMode: "auto" | "manual" = "manual"): AnalyzeJob {
  const jobId = `job_${report.id}`;
  const failedAccounts: string[] = [];
  const missingFields = Array.from(
    new Set([...(report.target.missingFields ?? []), ...report.benchmarks.flatMap((account) => account.missingFields)])
  );
  const job: AnalyzeJob = {
    jobId,
    reportId: report.id,
    status: "completed",
    progress: 100,
    successAccounts: 1 + report.benchmarks.length,
    failedAccounts,
    missingFields,
    benchmarkMode
  };

  memoryStore.reports.set(report.id, report);
  memoryStore.jobs.set(jobId, job);
  return job;
}

export function getReport(reportId: string): AnalysisReport | null {
  return memoryStore.reports.get(reportId) ?? null;
}

export function getJob(jobId: string): AnalyzeJob | null {
  return memoryStore.jobs.get(jobId) ?? null;
}

export function saveUpdatedReport(report: AnalysisReport): AnalysisReport {
  memoryStore.reports.set(report.id, report);
  return report;
}
