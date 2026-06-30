"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";
import { AnalysisReport } from "@/lib/types";

const RadarChart = dynamic(() => import("@/components/RadarChart"), { ssr: false });
const DEMO_TARGET = "https://www.douyin.com/user/MS4wLjABAAAA-demo-target";

function fmt(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

function daysSince(isoDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000));
}

function latestVideoDate(report: AnalysisReport): string | null {
  if (!report.target.videos.length) return null;
  return [...report.target.videos.map((v) => v.publishedAt)].sort().reverse()[0];
}

function getFlowPool(score: number, followers: number) {
  if (score >= 85 || followers >= 100000) return { range: "100W+", label: "头部量级流量池", level: 5, color: "#fe2c55" };
  if (score >= 70 || followers >= 30000) return { range: "30W-100W", label: "大量级流量池", level: 4, color: "#ff6b35" };
  if (score >= 50 || followers >= 5000) return { range: "10W-30W", label: "十万人量级流量池", level: 3, color: "#1989fa" };
  if (score >= 35 || followers >= 1000) return { range: "5W-10W", label: "小量级流量池", level: 2, color: "#07c160" };
  return { range: "1W-5W", label: "初级流量池", level: 1, color: "#aaa" };
}

function getStars(score: number): number {
  if (score >= 85) return 5;
  if (score >= 68) return 4;
  if (score >= 52) return 3;
  if (score >= 36) return 2;
  return 1;
}

function getAccountValue(followers: number, avgLikes: number): string {
  const estimatedReach = Math.max(followers * 0.08, avgLikes * 1.2);
  const value = (estimatedReach / 1000) * 25;
  return `¥${Math.max(0.01, value).toFixed(2)}`;
}

type BadgeStyle = "green" | "red" | "amber" | "blue" | "gray";

type DiagRow = {
  icon: string;
  label: string;
  value: string;
  badge: string;
  style: BadgeStyle;
  detail?: string;
};

function buildDiagRows(report: AnalysisReport): DiagRow[] {
  const { target, metrics, score } = report;
  const lastDate = latestVideoDate(report);
  const daysLapsed = lastDate ? daysSince(lastDate) : 999;
  const likeRatio = target.followers > 0 ? target.totalLikes / target.followers : 0;
  const viralThreshold = Math.max(metrics.avgLikes * 1.8, target.followers * 0.08);
  const viralCount = target.videos.filter((v) => v.likes >= viralThreshold).length;
  const hotRate = target.videos.length > 0 ? (viralCount / target.videos.length) * 100 : 0;
  const followingRatio = target.following > 0 ? target.followers / target.following : target.followers;
  const tagMap = new Map<string, number>();

  target.videos.flatMap((v) => v.tags).forEach((t) => tagMap.set(t, (tagMap.get(t) ?? 0) + 1));
  const topTags = [...tagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  return [
    {
      icon: "✍",
      label: "名字",
      value: target.nickname,
      badge: target.nickname.length >= 2 && target.nickname.length <= 10 ? "无需优化" : "建议优化",
      style: target.nickname.length >= 2 && target.nickname.length <= 10 ? "green" : "red"
    },
    {
      icon: "⚖",
      label: "权重",
      value: String(Math.round(score / 10)),
      badge: score >= 65 ? "权重良好" : score >= 45 ? "权重一般" : "权重偏低",
      style: score >= 65 ? "green" : score >= 45 ? "amber" : "red"
    },
    {
      icon: "👥",
      label: "粉丝",
      value: fmt(target.followers),
      badge: target.followers >= 10000 ? "粉丝良好" : target.followers >= 1000 ? "粉丝一般" : "粉丝偏少",
      style: target.followers >= 10000 ? "green" : target.followers >= 1000 ? "amber" : "gray"
    },
    {
      icon: "👍",
      label: "点赞",
      value: fmt(target.totalLikes),
      badge: likeRatio > 80 ? "赞粉比高" : likeRatio > 20 ? "赞粉适中" : "赞粉偏低",
      style: likeRatio > 20 ? "green" : "amber",
      detail: `赞粉比：${likeRatio.toFixed(1)}`
    },
    {
      icon: "🎬",
      label: "作品",
      value: String(target.videoCount),
      badge: daysLapsed > 30 ? `断更${daysLapsed}天` : daysLapsed > 7 ? "近期少发" : "更新正常",
      style: daysLapsed > 30 ? "red" : daysLapsed > 7 ? "amber" : "green"
    },
    {
      icon: "🔥",
      label: "热门",
      value: String(viralCount),
      badge: `近期热门率：${hotRate.toFixed(2)}%`,
      style: hotRate >= 20 ? "green" : hotRate >= 8 ? "amber" : "red"
    },
    { icon: "🚦", label: "卡流", value: "无", badge: "无需优化", style: "green" },
    { icon: "⚠", label: "限流", value: "无", badge: "无需优化", style: "green" },
    {
      icon: "📌",
      label: "关注",
      value: String(target.following),
      badge: `粉关比：${followingRatio.toFixed(1)}`,
      style: followingRatio >= 3 ? "green" : followingRatio >= 1 ? "amber" : "red"
    },
    {
      icon: "📄",
      label: "简介",
      value: target.bio.length > 0 ? target.bio.slice(0, 18) + (target.bio.length > 18 ? "..." : "") : "(无简介)",
      badge: target.bio.length >= 20 ? "无需优化" : target.bio.length > 0 ? "建议完善" : "建议添加",
      style: target.bio.length >= 20 ? "green" : "amber"
    },
    { icon: "👤", label: "身份", value: "公开", badge: "无需优化", style: "green" },
    {
      icon: "🏷",
      label: "话题",
      value: topTags.length > 0 ? topTags.slice(0, 2).join(" ") : "(无话题)",
      badge: topTags.length >= 3 ? "保持垂直" : topTags.length > 0 ? "适当增加" : "建议添加",
      style: topTags.length >= 3 ? "blue" : topTags.length > 0 ? "amber" : "red"
    },
    {
      icon: "#",
      label: "标签",
      value: topTags.slice(0, 2).join(", ") || "(无标签)",
      badge: topTags.length > 0 ? "无需优化" : "建议添加",
      style: topTags.length > 0 ? "green" : "red"
    },
    {
      icon: "📊",
      label: "评分",
      value: String(Math.round(score)),
      badge: score >= 60 ? "评分良好" : score >= 40 ? "评分一般" : "评分偏低",
      style: score >= 60 ? "green" : score >= 40 ? "amber" : "red"
    }
  ];
}

function Badge({ text, style }: { text: string; style: BadgeStyle }) {
  const classes: Record<BadgeStyle, string> = {
    green: "bg-emerald-500 text-white",
    red: "bg-rose-500 text-white",
    amber: "bg-amber-400 text-white",
    blue: "bg-blue-500 text-white",
    gray: "bg-slate-200 text-slate-500"
  };

  return <span className={`inline-block shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${classes[style]}`}>{text}</span>;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-xl ${i < stars ? "text-amber-400" : "text-slate-200"}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function FlowPoolGauge({ score, followers }: { score: number; followers: number }) {
  const pool = getFlowPool(score, followers);
  const radius = 52;
  const cx = 72;
  const cy = 72;
  const circumference = 2 * Math.PI * radius;
  const filled = (pool.level / 5) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 144, height: 144 }}>
        <svg width={144} height={144} viewBox="0 0 144 144">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={14}
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={circumference * 0.375}
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={pool.color}
            strokeWidth={14}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={circumference - circumference * 0.375}
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold leading-none text-slate-900">{pool.range}</span>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">{pool.label}</p>
    </div>
  );
}

function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {badge ? <span className="text-xs text-slate-400">{badge}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ReportView({ report }: { report: AnalysisReport }) {
  const { target, score, metrics } = report;
  const diagRows = buildDiagRows(report);
  const stars = getStars(score);
  const accountValue = getAccountValue(target.followers, metrics.avgLikes);
  const bestPostTime = report.suggestions.find((s) => s.category === "schedule")?.title.replace("建议发布时间：", "") ?? metrics.bestHours[0] ?? "21:00-22:00";
  const bestLiveTime = metrics.bestHours[1] ?? "19:00-20:00";
  const qualityGrade = score >= 65 ? "优质号" : score >= 45 ? "成长号" : "需优化";
  const qualityNote = score >= 65 ? "账号质量良好" : score >= 45 ? "建议加强作品质量" : "建议系统优化定位";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}>
        <div className="px-4 pb-4 pt-5">
          <div className="mb-4 flex items-center gap-3">
            <img src={target.avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full border-2 border-white/20 bg-white/10 object-cover" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-bold">{target.nickname}</h2>
                <span className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "#fe2c55" }}>
                  {report.grade}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/50">@{target.handle}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "粉丝", value: fmt(target.followers) },
              { label: "获赞", value: fmt(target.totalLikes) },
              { label: "作品", value: String(target.videoCount) },
              { label: "综合分", value: String(Math.round(score)) }
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/10 py-2 text-center">
                <p className="text-base font-extrabold leading-none">{item.value}</p>
                <p className="mt-1 text-[10px] text-white/50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2">
          <span className="text-[10px] text-white/40">置信度</span>
          <span className="text-xs font-semibold text-white/70">{report.confidence === "high" ? "高" : report.confidence === "medium" ? "中" : "低"}</span>
          <span className="text-white/20">·</span>
          <span className="text-[10px] text-white/40">数据完整度</span>
          <span className="text-xs font-semibold text-white/70">{Math.round(report.dataCompleteness * 100)}%</span>
        </div>
      </div>

      <Card title="账号能力雷达" badge="6 维">
        <RadarChart data={report.radar} />
      </Card>

      <Card title="账号权重诊断结果" badge={`${diagRows.length} 项`}>
        <div className="divide-y divide-slate-50">
          {diagRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 shrink-0 text-center text-base">{row.icon}</span>
              <span className="w-8 shrink-0 text-xs text-slate-400">{row.label}</span>
              <span className="flex-1 truncate text-sm text-slate-700">{row.value}</span>
              {row.detail ? <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{row.detail}</span> : null}
              <Badge text={row.badge} style={row.style} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="流量池预测">
          <div className="flex items-center justify-center py-6">
            <FlowPoolGauge score={score} followers={target.followers} />
          </div>
        </Card>
        <Card title="发布建议">
          <div className="divide-y divide-slate-50">
            {[
              { icon: "⏰", label: "时间", value: bestPostTime, badge: "建议发布时间", style: "blue" as BadgeStyle },
              { icon: "📺", label: "直播", value: bestLiveTime, badge: "建议开播时间", style: "blue" as BadgeStyle },
              { icon: "💰", label: "价值", value: accountValue, badge: "仅供参考", style: "gray" as BadgeStyle },
              { icon: "🏆", label: "质量", value: qualityGrade, badge: qualityNote, style: (score >= 65 ? "green" : "amber") as BadgeStyle }
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                <span className="shrink-0 text-base">{item.icon}</span>
                <span className="w-8 shrink-0 text-xs text-slate-400">{item.label}</span>
                <span className="flex-1 text-sm font-semibold text-slate-800">{item.value}</span>
                <Badge text={item.badge} style={item.style} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="综合评级">
        <div className="flex items-center gap-4 px-4 py-4">
          <StarRating stars={stars} />
          <div>
            <p className="text-sm font-bold text-slate-900">{stars >= 4 ? "优质账号" : stars >= 3 ? "成长中账号" : "待提升账号"}</p>
            <p className="mt-0.5 text-xs text-slate-400">综合得分 {Math.round(score)} / 100，{report.grade}等级</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-extrabold text-slate-900">{Math.round(score)}</p>
            <p className="text-xs text-slate-400">0-100分</p>
          </div>
        </div>
      </Card>

      {report.benchmarkGaps.length > 0 ? (
        <Card title="对标差距分析" badge={`${report.benchmarks.length} 个对标账号`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase text-slate-400">
                  <th className="px-4 py-2.5 text-left font-semibold">指标</th>
                  <th className="px-2 py-2.5 text-right font-semibold">本账号</th>
                  <th className="px-2 py-2.5 text-right font-semibold">对标均值</th>
                  <th className="px-4 py-2.5 text-right font-semibold">差距</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {report.benchmarkGaps.map((gap) => (
                  <tr key={gap.metric}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{gap.metric}</td>
                    <td className="px-2 py-2.5 text-right text-slate-600">{gap.targetValue}</td>
                    <td className="px-2 py-2.5 text-right text-slate-400">{gap.benchmarkValue}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge text={gap.delta} style={gap.status === "ahead" ? "green" : gap.status === "similar" ? "gray" : "red"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card title="运营建议" badge={`${report.suggestions.length} 条`}>
        <div className="divide-y divide-slate-50">
          {report.suggestions.map((s) => (
            <div key={s.title} className="px-4 py-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge text={s.priority === "high" ? "优先" : s.priority === "medium" ? "建议" : "观察"} style={s.priority === "high" ? "red" : s.priority === "medium" ? "amber" : "gray"} />
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
              </div>
              <p className="text-sm leading-6 text-slate-600">{s.action}</p>
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-400">{s.evidence}</p>
            </div>
          ))}
        </div>
      </Card>

      {report.benchmarks.length > 0 ? (
        <Card title="自动对标账号" badge={`${report.benchmarks.length} 个`}>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
            {report.benchmarks.map((acc) => (
              <div key={acc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <img src={acc.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full bg-slate-200 object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{acc.nickname}</p>
                    <p className="truncate text-[10px] text-slate-400">@{acc.handle}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="rounded-lg bg-white py-1.5 text-center">
                    <p className="text-xs font-bold text-slate-900">{fmt(acc.followers)}</p>
                    <p className="text-[10px] text-slate-400">粉丝</p>
                  </div>
                  <div className="rounded-lg bg-white py-1.5 text-center">
                    <p className="text-xs font-bold text-slate-900">{acc.videos.length}</p>
                    <p className="text-[10px] text-slate-400">样本</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white" style={{ background: "linear-gradient(135deg, #fe2c55, #ff6b6b)" }}>
        DY
      </div>
      <h2 className="text-base font-bold text-slate-900">等待生成账号报告</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-400">填入抖音账号主页链接，系统自动分析权重评分、诊断问题并给出运营建议。</p>
    </div>
  );
}

export default function Home() {
  const [targetUrl, setTargetUrl] = useState(DEMO_TARGET);
  const [benchmarkText, setBenchmarkText] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const benchmarkUrls = useMemo(
    () =>
      benchmarkText
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean),
    [benchmarkText]
  );

  async function analyze(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetProfileUrl: targetUrl, benchmarkProfileUrls: benchmarkUrls })
      });
      const job = await res.json();
      if (!res.ok) throw new Error(job.message ?? "分析失败");
      const repRes = await fetch(`/api/reports/${job.reportId}`);
      const nextReport = await repRes.json();
      if (!repRes.ok) throw new Error(nextReport.message ?? "读取报告失败");
      setReport(nextReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#f0f2f5" }}>
      <header style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white" style={{ background: "#fe2c55" }}>
            DY
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none text-white">抖音账号权重分析</h1>
            <p className="mt-0.5 text-[10px] text-white/40">公开数据估算 · 不代表平台内部权重</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
          <div className="space-y-4">
            <form onSubmit={analyze} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 pb-2 pt-4">
                <h2 className="text-sm font-bold text-slate-900">账号查询</h2>
              </div>
              <div className="space-y-3 px-4 py-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">主账号主页链接</label>
                  <input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="https://www.douyin.com/user/..."
                  />
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold leading-5 text-blue-700">自动抓取同赛道对标账号</p>
                    <button
                      type="button"
                      onClick={() => setShowManual((v) => !v)}
                      className="shrink-0 rounded-lg border border-blue-200 bg-white px-2 py-1 text-[11px] text-blue-600 transition hover:bg-blue-50"
                    >
                      {showManual ? "收起" : "手动覆盖"}
                    </button>
                  </div>
                  {showManual ? (
                    <textarea
                      value={benchmarkText}
                      onChange={(e) => setBenchmarkText(e.target.value)}
                      className="mt-2 min-h-24 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs leading-5 outline-none"
                      placeholder="每行一个链接"
                    />
                  ) : null}
                </div>
                {error ? <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p> : null}
                <button type="submit" disabled={loading} className="h-11 w-full rounded-xl text-sm font-bold text-white transition disabled:opacity-60" style={{ background: loading ? "#aaa" : "#fe2c55" }}>
                  {loading ? "正在分析账号..." : "开始分析"}
                </button>
              </div>
            </form>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-bold text-slate-900">可靠性说明</h3>
              <div className="space-y-2">
                {[
                  { title: "公开字段优先", desc: "抓不到播放量时自动降低置信度" },
                  { title: "结论可追溯", desc: "每条建议绑定真实数据依据" },
                  { title: "不做风控对抗", desc: "不绕过登录或验证码" }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm text-emerald-500">✓</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>{report ? <ReportView report={report} /> : <EmptyState />}</div>
        </div>
      </div>
    </div>
  );
}
