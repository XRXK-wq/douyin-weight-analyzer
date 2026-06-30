import {
  AccountMetrics,
  AnalysisReport,
  BenchmarkGap,
  DiagnosisItem,
  DouyinAccount,
  MetricConfidence,
  RadarMetric,
  ScoreBreakdown,
  Suggestion
} from "./types";
import { createStableId } from "./url";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return Math.round(value).toLocaleString("zh-CN");
}

function formatRate(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function videoImpact(video: DouyinAccount["videos"][number]): number {
  return video.likes + video.comments * 3 + (video.shares ?? 0) * 2 + (video.favorites ?? 0) * 1.5;
}

function getTopTags(account: DouyinAccount, limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const tag of account.videos.flatMap((video) => video.tags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function inferVertical(account: DouyinAccount): { field: string; pillars: string[]; topics: string[]; titleFormula: string } {
  const text = `${account.bio} ${account.videos.map((video) => `${video.title} ${video.tags.join(" ")}`).join(" ")}`;
  const tags = getTopTags(account, 6);
  const has = (words: string[]) => words.some((word) => text.includes(word));

  if (has(["光遇", "游戏", "二次元", "TGC", "斗篷", "复刻", "季节任务"])) {
    return {
      field: tags.includes("光遇") ? "光遇游戏内容" : "游戏/二次元内容",
      pillars: ["剧情/情绪共鸣", "机制/攻略答疑", "互动日常/玩家故事"],
      topics: ["版本活动/复刻预测", "玩家冷知识", "新手体验", "打卡点/动作展示"],
      titleFormula: "问题 + 游戏场景 + 互动提问"
    };
  }
  if (has(["创业", "商业", "认知", "副业", "赚钱"])) {
    return {
      field: "商业认知/副业成长",
      pillars: ["案例拆解", "方法论清单", "避坑复盘"],
      topics: ["普通人副业路径", "商业案例复盘", "认知误区", "工具/流程模板"],
      titleFormula: "痛点 + 反常识观点 + 可执行结果"
    };
  }
  if (has(["穿搭", "通勤", "显瘦", "质感", "服饰"])) {
    return {
      field: "穿搭审美/生活方式",
      pillars: ["场景穿搭", "单品测评", "风格改造"],
      topics: ["通勤搭配", "显瘦公式", "平价替代", "一衣多穿"],
      titleFormula: "场景 + 身材/风格痛点 + 搭配结果"
    };
  }
  if (has(["美食", "探店", "本地生活", "性价比", "餐厅"])) {
    return {
      field: "美食探店/本地生活",
      pillars: ["真实探店", "菜单攻略", "避坑推荐"],
      topics: ["高性价比餐厅", "隐藏菜单", "城市周末路线", "新品测评"],
      titleFormula: "地点 + 价格/特色 + 是否值得去"
    };
  }
  if (has(["剧情", "反转", "职场", "情感", "故事"])) {
    return {
      field: "剧情故事/情感内容",
      pillars: ["强冲突故事", "反转结尾", "评论共创"],
      topics: ["职场误会", "关系边界", "高共鸣独白", "评论区续集"],
      titleFormula: "冲突开头 + 情绪钩子 + 反转承诺"
    };
  }

  return {
    field: tags.slice(0, 2).join("/") || "当前垂直领域",
    pillars: ["核心知识", "场景案例", "粉丝互动"],
    topics: tags.length ? tags.slice(0, 4) : ["入门内容", "进阶内容", "案例复盘", "互动问答"],
    titleFormula: "目标用户痛点 + 具体场景 + 明确收益"
  };
}

function getBestSchedule(target: DouyinAccount, benchmarks: DouyinAccount[]): { slots: string[]; evidence: string } {
  const hourly = new Map<number, { score: number; source: "target" | "benchmark" }[]>();
  const add = (hour: number, score: number, source: "target" | "benchmark") => {
    hourly.set(hour, [...(hourly.get(hour) ?? []), { score, source }]);
  };

  for (const video of target.videos) {
    add(new Date(video.publishedAt).getHours(), videoImpact(video), "target");
  }
  for (const account of benchmarks) {
    for (const video of account.videos) {
      add(new Date(video.publishedAt).getHours(), videoImpact(video) * 0.72, "benchmark");
    }
  }

  const ranked = Array.from(hourly.entries())
    .map(([hour, rows]) => {
      const targetRows = rows.filter((row) => row.source === "target");
      const benchmarkRows = rows.filter((row) => row.source === "benchmark");
      const targetAvg = average(targetRows.map((row) => row.score));
      const benchmarkAvg = average(benchmarkRows.map((row) => row.score));
      const blended = targetRows.length > 0 ? targetAvg * 0.82 + benchmarkAvg * 0.18 : benchmarkAvg * 0.72;
      const confidence = Math.min(rows.length / 4, 1);
      return { hour, score: blended * (0.82 + confidence * 0.18), count: rows.length, targetCount: targetRows.length };
    })
    .filter((item) => (target.videos.length >= 3 ? item.targetCount > 0 : item.targetCount > 0 || item.count >= 2))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const slots = ranked.map((item) => `${String(item.hour).padStart(2, "0")}:00-${String((item.hour + 1) % 24).padStart(2, "0")}:00`);

  return {
    slots: slots.length ? slots : ["21:00-22:00", "22:00-23:00"],
    evidence: ranked.length
      ? `主账号已有 ${target.videos.length} 条样本，优先按本账号同小时互动分排序，再用 ${benchmarks.length} 个对标账号做轻量校准，最高时段为 ${slots.join("、")}。`
      : "近期样本不足，先采用游戏内容常见晚间活跃时段 21:00-23:00。"
  };
}

export function calculateMetrics(account: DouyinAccount): AccountMetrics {
  const videos = account.videos.slice(0, 50);
  const avgLikes = average(videos.map((video) => video.likes));
  const avgComments = average(videos.map((video) => video.comments));
  const avgShares = average(videos.map((video) => video.shares ?? 0));
  const avgFavorites = average(videos.map((video) => video.favorites ?? 0));
  const engagementRate = account.followers > 0 ? (avgLikes + avgComments + avgShares + avgFavorites) / account.followers : 0;
  const viralThreshold = Math.max(avgLikes * 1.8, account.followers * 0.08);
  const viralRate = videos.length > 0 ? videos.filter((video) => video.likes >= viralThreshold).length / videos.length : 0;
  const newest = Math.max(...videos.map((video) => new Date(video.publishedAt).getTime()));
  const oldest = Math.min(...videos.map((video) => new Date(video.publishedAt).getTime()));
  const days = Math.max(1, (newest - oldest) / 86400000);
  const weeklyPosts = (videos.length / days) * 7;
  const tags = videos.flatMap((video) => video.tags);
  const tagCounts = Array.from(new Set(tags)).map((tag) => tags.filter((item) => item === tag).length);
  const tagConcentration = tags.length > 0 ? Math.max(...tagCounts) / tags.length : 0;
  const hourlyLikes = new Map<number, number[]>();

  for (const video of videos) {
    const hour = new Date(video.publishedAt).getHours();
    hourlyLikes.set(hour, [...(hourlyLikes.get(hour) ?? []), videoImpact(video)]);
  }

  const bestHours = Array.from(hourlyLikes.entries())
    .map(([hour, scores]) => ({ hour, avg: average(scores) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 2)
    .map((item) => `${String(item.hour).padStart(2, "0")}:00-${String((item.hour + 1) % 24).padStart(2, "0")}:00`);

  return { avgLikes, avgComments, avgShares, avgFavorites, engagementRate, viralRate, weeklyPosts, tagConcentration, bestHours };
}

function aggregateBenchmarkMetrics(benchmarks: DouyinAccount[]): AccountMetrics | null {
  if (!benchmarks.length) return null;
  const metrics = benchmarks.map((account) => calculateMetrics(account));
  return {
    avgLikes: average(metrics.map((item) => item.avgLikes)),
    avgComments: average(metrics.map((item) => item.avgComments)),
    avgShares: average(metrics.map((item) => item.avgShares)),
    avgFavorites: average(metrics.map((item) => item.avgFavorites)),
    engagementRate: average(metrics.map((item) => item.engagementRate)),
    viralRate: average(metrics.map((item) => item.viralRate)),
    weeklyPosts: average(metrics.map((item) => item.weeklyPosts)),
    tagConcentration: average(metrics.map((item) => item.tagConcentration)),
    bestHours: metrics.flatMap((item) => item.bestHours).slice(0, 3)
  };
}

function scoreBreakdown(account: DouyinAccount, metrics: AccountMetrics, benchmarkMetrics: AccountMetrics | null): ScoreBreakdown {
  const followerScore = clamp(Math.log10(account.followers + 10) * 16);
  const base = clamp((followerScore + Math.log10(account.totalLikes + 10) * 10 + Math.min(account.videoCount, 120) / 1.2) / 3);
  const update = clamp((metrics.weeklyPosts / 5) * 100);
  const benchmarkEngagement = benchmarkMetrics?.engagementRate ?? 0.045;
  const interaction = clamp((metrics.engagementRate / Math.max(benchmarkEngagement, 0.01)) * 72);
  const verticality = clamp(metrics.tagConcentration * 170);
  const viral = clamp(metrics.viralRate * 260 + (metrics.avgLikes / Math.max(account.followers, 1)) * 360);
  const risk = clamp(100 - account.missingFields.length * 8 - (metrics.weeklyPosts < 1 ? 28 : 0) - (metrics.engagementRate < 0.01 ? 24 : 0));

  return {
    accountBase: base * 0.1,
    updateStability: update * 0.15,
    interactionEfficiency: interaction * 0.25,
    contentVerticality: verticality * 0.2,
    viralPotential: viral * 0.15,
    riskSignal: risk * 0.15
  };
}

function grade(score: number): string {
  if (score >= 90) return "强势";
  if (score >= 75) return "优质";
  if (score >= 60) return "良好";
  if (score >= 40) return "一般";
  return "偏弱";
}

function confidence(account: DouyinAccount, benchmarks: DouyinAccount[]): MetricConfidence {
  const sampleSize = account.videos.length + benchmarks.reduce((sum, item) => sum + item.videos.length, 0);
  if (account.missingFields.length === 0 && benchmarks.length >= 3 && sampleSize >= 80) return "high";
  if (benchmarks.length >= 2 && sampleSize >= 45) return "medium";
  return "low";
}

function dataCompleteness(account: DouyinAccount): number {
  const expected = account.videos.length * 6 + 6;
  const missing = account.missingFields.length + account.videos.filter((video) => video.views === undefined).length;
  return clamp((expected - missing) / expected, 0, 1);
}

function buildRadar(account: DouyinAccount, metrics: AccountMetrics, breakdown: ScoreBreakdown): RadarMetric[] {
  return [
    { name: "粉丝基础", value: clamp(breakdown.accountBase * 10) },
    { name: "互动效率", value: clamp(breakdown.interactionEfficiency * 4) },
    { name: "内容垂直度", value: clamp(metrics.tagConcentration * 100) },
    { name: "爆款潜力", value: clamp(breakdown.viralPotential * 6.67) },
    { name: "更新稳定性", value: clamp(breakdown.updateStability * 6.67) },
    { name: "商业价值", value: clamp(Math.log10(account.followers + account.totalLikes + 10) * 15) }
  ];
}

function buildGaps(target: DouyinAccount, metrics: AccountMetrics, benchmarkMetrics: AccountMetrics | null): BenchmarkGap[] {
  if (!benchmarkMetrics) return [];

  const gap = (metric: string, targetValue: number, benchmarkValue: number, formatter: (value: number) => string): BenchmarkGap => {
    const ratio = benchmarkValue === 0 ? 0 : (targetValue - benchmarkValue) / benchmarkValue;
    return {
      metric,
      targetValue: formatter(targetValue),
      benchmarkValue: formatter(benchmarkValue),
      delta: `${ratio >= 0 ? "高于" : "低于"} ${Math.abs(ratio * 100).toFixed(0)}%`,
      status: Math.abs(ratio) < 0.12 ? "similar" : ratio > 0 ? "ahead" : "behind",
      evidence: `主账号近 ${target.videos.length} 条作品与对标账号均值比较。`
    };
  };

  return [
    gap("平均点赞", metrics.avgLikes, benchmarkMetrics.avgLikes, formatNumber),
    gap("互动率", metrics.engagementRate, benchmarkMetrics.engagementRate, formatRate),
    gap("爆款率", metrics.viralRate, benchmarkMetrics.viralRate, formatRate),
    gap("周更新频率", metrics.weeklyPosts, benchmarkMetrics.weeklyPosts, (value) => `${value.toFixed(1)} 条/周`),
    gap("标签集中度", metrics.tagConcentration, benchmarkMetrics.tagConcentration, formatRate)
  ];
}

function buildDiagnosis(account: DouyinAccount, metrics: AccountMetrics, score: number): DiagnosisItem[] {
  return [
    {
      label: "账号类型",
      value: "内容创作 + 个人IP",
      status: "good",
      evidenceType: "estimated",
      confidence: "medium",
      evidence: "结合简介、标签和作品主题判断，账号更适合做垂直兴趣内容和个人IP承接。"
    },
    {
      label: "权重估算",
      value: `${Math.round(score)} / 100`,
      status: score >= 75 ? "good" : score >= 55 ? "warn" : "bad",
      evidenceType: "estimated",
      confidence: "medium",
      evidence: "由账号基础、更新稳定、互动效率、内容垂直、爆款能力和风险信号加权得到。"
    },
    {
      label: "内容垂直",
      value: formatRate(metrics.tagConcentration),
      status: metrics.tagConcentration >= 0.35 ? "good" : "warn",
      evidenceType: "estimated",
      confidence: "medium",
      evidence: `高频标签为 ${getTopTags(account, 4).join("、") || "暂无"}，标签越集中越利于账号定位稳定。`
    },
    {
      label: "互动效率",
      value: formatRate(metrics.engagementRate),
      status: metrics.engagementRate >= 0.05 ? "good" : metrics.engagementRate >= 0.02 ? "warn" : "bad",
      evidenceType: "estimated",
      confidence: "medium",
      evidence: `近 ${account.videos.length} 条作品平均点赞 ${formatNumber(metrics.avgLikes)}，平均评论 ${formatNumber(metrics.avgComments)}。`
    },
    {
      label: "更新稳定",
      value: `${metrics.weeklyPosts.toFixed(1)} 条/周`,
      status: metrics.weeklyPosts >= 3 ? "good" : metrics.weeklyPosts >= 1 ? "warn" : "bad",
      evidenceType: "certain",
      confidence: "high",
      evidence: "按近期作品发布时间间隔计算；断更会明显影响账号活跃信号。"
    },
    {
      label: "数据完整度",
      value: `${Math.round(dataCompleteness(account) * 100)}%`,
      status: account.missingFields.length === 0 ? "good" : "warn",
      evidenceType: "certain",
      confidence: "high",
      evidence: account.missingFields.length ? `缺失：${account.missingFields.join("、")}。` : "关键公开字段完整。"
    }
  ];
}

function buildSuggestions(target: DouyinAccount, benchmarks: DouyinAccount[], metrics: AccountMetrics, benchmarkGaps: BenchmarkGap[]): Suggestion[] {
  const behind = benchmarkGaps.filter((gap) => gap.status === "behind");
  const tags = getTopTags(target, 6);
  const vertical = inferVertical(target);
  const schedule = getBestSchedule(target, benchmarks);
  const suggestions: Suggestion[] = [
    {
      title: `垂直定位：${vertical.field}`,
      priority: metrics.tagConcentration >= 0.35 ? "medium" : "high",
      category: "content",
      action: `把内容收束到 ${vertical.field}，固定 3 个栏目：${vertical.pillars.join("、")}。昵称、简介、置顶作品都围绕这个领域表达，减少跨赛道混发。`,
      evidence: `近 ${target.videos.length} 条作品高频标签为 ${tags.join("、") || "暂无"}，标签集中度 ${formatRate(metrics.tagConcentration)}。`
    },
    {
      title: `建议发布时间：${schedule.slots.join("、")}`,
      priority: "medium",
      category: "schedule",
      action: `优先在 ${schedule.slots.join(" 或 ")} 发布重点内容。冷知识/攻略放前一个时段，怀旧剧情和互动提问放后一个时段；连续测试 14 天后按互动分复盘。`,
      evidence: schedule.evidence
    },
    {
      title: "选题方向：围绕垂直领域做系列",
      priority: "high",
      category: "content",
      action: `优先做“${vertical.topics.join("”“")}”四类系列，每条结尾加一个和领域强相关的问题，引导同类用户评论。`,
      evidence: `当前互动率 ${formatRate(metrics.engagementRate)}，建议用 ${vertical.titleFormula} 的标题结构提高点击和评论。`
    },
    {
      title: "主页与粉丝承接",
      priority: "medium",
      category: "profile",
      action: `把简介改成“${target.nickname}｜${vertical.field}｜${vertical.pillars.slice(0, 2).join("/")}｜合作可私信”，置顶 1 条自我介绍和 2 条高互动代表作。`,
      evidence: `当前粉丝 ${formatNumber(target.followers)}、获赞 ${formatNumber(target.totalLikes)}，获赞/粉丝比高，说明老内容有吸引力，但需要更清晰的关注理由。`
    }
  ];

  if (behind[0]) {
    suggestions.push({
      title: `对标修复：${behind[0].metric}`,
      priority: "medium",
      category: "benchmark",
      action: `围绕 ${behind[0].metric} 做 7 天专项优化，选题保持 ${vertical.field} 垂直，标题采用“${vertical.titleFormula}”的结构。`,
      evidence: `${behind[0].metric} 当前 ${behind[0].targetValue}，对标均值 ${behind[0].benchmarkValue}，${behind[0].delta}。`
    });
  }

  return suggestions;
}

export function createAnalysisReport(target: DouyinAccount, benchmarks: DouyinAccount[]): AnalysisReport {
  const metrics = calculateMetrics(target);
  const benchmarkMetrics = aggregateBenchmarkMetrics(benchmarks);
  const breakdown = scoreBreakdown(target, metrics, benchmarkMetrics);
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const benchmarkGaps = buildGaps(target, metrics, benchmarkMetrics);

  return {
    id: createStableId(`${target.profileUrl}-${Date.now()}`),
    target,
    benchmarks,
    metrics,
    benchmarkMetrics,
    score,
    grade: grade(score),
    confidence: confidence(target, benchmarks),
    dataCompleteness: dataCompleteness(target),
    breakdown,
    radar: buildRadar(target, metrics, breakdown),
    diagnosis: buildDiagnosis(target, metrics, score),
    benchmarkGaps,
    suggestions: buildSuggestions(target, benchmarks, metrics, benchmarkGaps),
    generatedAt: new Date().toISOString(),
    disclaimer: "本报告基于公开可见数据和运营经验模型估算，不代表抖音官方内部权重。"
  };
}
