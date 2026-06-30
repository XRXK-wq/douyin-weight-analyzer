"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";
import { AnalysisReport } from "@/lib/types";

const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });

const DEMO_TARGET = "https://www.douyin.com/user/MS4wLjABAAAA-demo-target";

function statusTone(status: string) {
  if (status === "good" || status === "ahead") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "bad" || status === "behind") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function confidenceLabel(value: string) {
  if (value === "high") return "高";
  if (value === "medium") return "中";
  return "低";
}

function priorityLabel(value: string) {
  if (value === "high") return "优先";
  if (value === "medium") return "建议";
  return "观察";
}

export default function Home() {
  const [targetUrl, setTargetUrl] = useState(DEMO_TARGET);
  const [benchmarkText, setBenchmarkText] = useState("");
  const [showManualBenchmarks, setShowManualBenchmarks] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const benchmarkUrls = useMemo(
    () =>
      benchmarkText
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    [benchmarkText]
  );

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProfileUrl: targetUrl, benchmarkProfileUrls: benchmarkUrls })
      });
      const job = await response.json();
      if (!response.ok) throw new Error(job.message ?? "分析失败");

      const reportResponse = await fetch(`/api/reports/${job.reportId}`);
      const nextReport = await reportResponse.json();
      if (!reportResponse.ok) throw new Error(nextReport.message ?? "读取报告失败");
      setReport(nextReport);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "分析失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              INTERNAL OPS ANALYTICS
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
              抖音账号权重分析与自动对标
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              输入主账号主页链接，系统自动发现同赛道对标账号，生成权重估算、可靠性提示、对标差距和可追溯运营建议。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <MiniStat label="自动对标" value="5" />
            <MiniStat label="维度评分" value="6" />
            <MiniStat label="建议追溯" value="100%" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <form onSubmit={analyze} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">账号检测</h2>
                <p className="mt-1 text-xs text-slate-500">公开数据估算，不代表平台内部权重</p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">可用</span>
            </div>

            <label className="text-sm font-semibold text-slate-900" htmlFor="target-url">
              主账号主页链接
            </label>
            <input
              id="target-url"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
              placeholder="https://www.douyin.com/user/..."
            />

            <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">自动抓取对标账号</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    默认按赛道标签和粉丝量级匹配同类账号。需要指定竞品时，可手动覆盖。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualBenchmarks((value) => !value)}
                  className="h-9 shrink-0 rounded-md border border-cyan-300 bg-white px-3 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
                >
                  {showManualBenchmarks ? "收起" : "覆盖"}
                </button>
              </div>

              {showManualBenchmarks ? (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-900" htmlFor="benchmark-urls">
                    手动对标账号链接
                  </label>
                  <textarea
                    id="benchmark-urls"
                    value={benchmarkText}
                    onChange={(event) => setBenchmarkText(event.target.value)}
                    className="mt-2 min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                    placeholder="每行一个链接；填写后优先使用手动账号"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
              <MiniStat label="样本作品" value="20-50" />
              <MiniStat label={benchmarkUrls.length ? "手动对标" : "自动对标"} value={String(benchmarkUrls.length || 5)} />
              <MiniStat label="风险降级" value="ON" />
            </div>

            {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 h-12 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "正在分析账号..." : "开始分析"}
            </button>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-950">可靠性策略</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <ReliabilityItem title="公开字段优先" text="抓不到播放量或收藏时，报告会自动降级置信度。" />
              <ReliabilityItem title="结论可追溯" text="每条建议都绑定主账号数据或对标均值。" />
              <ReliabilityItem title="不做风控对抗" text="不绕过登录、验证码或平台限制。" />
            </div>
          </section>
        </aside>

        {report ? <ReportView report={report} /> : <EmptyState />}
      </div>
    </main>
  );
}

function ReportView({ report }: { report: AnalysisReport }) {
  const score = Math.round(report.score);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <img src={report.target.avatarUrl} alt="" className="h-16 w-16 rounded-full border border-slate-200 bg-slate-50" />
              <div>
                <p className="text-xs font-semibold text-cyan-700">TARGET ACCOUNT</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">{report.target.nickname}</h2>
                <p className="mt-1 text-sm text-slate-500">@{report.target.handle}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ScoreTile label="综合分" value={String(score)} strong />
              <ScoreTile label="权重估算" value={report.grade} />
              <ScoreTile label="置信度" value={confidenceLabel(report.confidence)} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Metric label="粉丝" value={report.target.followers.toLocaleString("zh-CN")} />
            <Metric label="获赞" value={report.target.totalLikes.toLocaleString("zh-CN")} />
            <Metric label="作品" value={report.target.videoCount.toLocaleString("zh-CN")} />
            <Metric label="数据完整度" value={`${Math.round(report.dataCompleteness * 100)}%`} />
          </div>

          <p className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {report.disclaimer}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">账号能力雷达</h2>
            <span className="rounded-md bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">6 维</span>
          </div>
          <RadarChart data={report.radar} />
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="诊断结果" badge={`${report.diagnosis.length} 项`}>
          <div className="space-y-3">
            {report.diagnosis.map((item) => (
              <article key={item.label} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.evidence}</p>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusTone(item.status)}`}>
                    {item.value}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="对标差距" badge={`${report.benchmarkGaps.length} 项`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-3">指标</th>
                  <th>主账号</th>
                  <th>对标均值</th>
                  <th>差距</th>
                </tr>
              </thead>
              <tbody>
                {report.benchmarkGaps.map((gap) => (
                  <tr key={gap.metric} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-semibold text-slate-950">{gap.metric}</td>
                    <td className="text-slate-700">{gap.targetValue}</td>
                    <td className="text-slate-700">{gap.benchmarkValue}</td>
                    <td>
                      <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusTone(gap.status)}`}>
                        {gap.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="系统自动对标账号" badge={`${report.benchmarks.length} 个`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {report.benchmarks.map((account) => (
            <article key={account.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <img src={account.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{account.nickname}</p>
                  <p className="truncate text-xs text-slate-500">@{account.handle}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <SmallMetric label="粉丝" value={account.followers.toLocaleString("zh-CN")} />
                <SmallMetric label="样本" value={String(account.videos.length)} />
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="运营建议" badge={`${report.suggestions.length} 条`}>
        <div className="grid gap-4 md:grid-cols-2">
          {report.suggestions.map((suggestion) => (
            <article key={suggestion.title} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-950">{suggestion.title}</h3>
                <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
                  {priorityLabel(suggestion.priority)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{suggestion.action}</p>
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                {suggestion.evidence}
              </p>
            </article>
          ))}
        </div>
      </Panel>

    </section>
  );
}

function EmptyState() {
  return (
    <section className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-950 text-lg font-bold text-white">
          DY
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-950">等待生成账号报告</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          填入主账号链接后，系统会自动抓取对标账号，并输出评分、差距和运营建议。
        </p>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-center">
      <strong className="block text-base font-bold text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs text-slate-500">{label}</span>
    </div>
  );
}

function ScoreTile({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "rounded-lg bg-slate-950 px-5 py-4 text-white" : "rounded-lg border border-slate-200 bg-slate-50 px-5 py-4"}>
      <p className={strong ? "text-3xl font-bold" : "text-2xl font-bold text-slate-950"}>{value}</p>
      <p className={strong ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-500"}>{label}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-slate-50 px-2 py-2 text-center">
      <strong className="block truncate text-slate-950">{value}</strong>
      <span className="mt-1 block text-slate-500">{label}</span>
    </span>
  );
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {badge ? <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{badge}</span> : null}
      </div>
      {children}
    </section>
  );
}

function ReliabilityItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
