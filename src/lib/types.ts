export type MetricConfidence = "high" | "medium" | "low";

export type EvidenceType = "certain" | "estimated" | "risk";

export type DouyinVideo = {
  id: string;
  title: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares?: number;
  favorites?: number;
  views?: number;
  tags: string[];
  isPinned?: boolean;
};

export type DouyinAccount = {
  id: string;
  profileUrl: string;
  nickname: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  totalLikes: number;
  videoCount: number;
  videos: DouyinVideo[];
  collectedAt: string;
  missingFields: string[];
};

export type ScoreBreakdown = {
  accountBase: number;
  updateStability: number;
  interactionEfficiency: number;
  contentVerticality: number;
  viralPotential: number;
  riskSignal: number;
};

export type RadarMetric = {
  name: string;
  value: number;
};

export type DiagnosisItem = {
  label: string;
  value: string;
  status: "good" | "warn" | "bad" | "neutral";
  evidenceType: EvidenceType;
  confidence: MetricConfidence;
  evidence: string;
};

export type Suggestion = {
  title: string;
  priority: "high" | "medium" | "low";
  category: "profile" | "content" | "schedule" | "benchmark" | "risk";
  action: string;
  evidence: string;
};

export type BenchmarkGap = {
  metric: string;
  targetValue: string;
  benchmarkValue: string;
  delta: string;
  status: "ahead" | "behind" | "similar";
  evidence: string;
};

export type AccountMetrics = {
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgFavorites: number;
  engagementRate: number;
  viralRate: number;
  weeklyPosts: number;
  tagConcentration: number;
  bestHours: string[];
};

export type AnalysisReport = {
  id: string;
  target: DouyinAccount;
  benchmarks: DouyinAccount[];
  metrics: AccountMetrics;
  benchmarkMetrics: AccountMetrics | null;
  score: number;
  grade: string;
  confidence: MetricConfidence;
  dataCompleteness: number;
  breakdown: ScoreBreakdown;
  radar: RadarMetric[];
  diagnosis: DiagnosisItem[];
  benchmarkGaps: BenchmarkGap[];
  suggestions: Suggestion[];
  generatedAt: string;
  disclaimer: string;
};

export type AnalyzeRequest = {
  targetProfileUrl: string;
  benchmarkProfileUrls: string[];
};

export type AnalyzeJob = {
  jobId: string;
  reportId: string;
  status: "completed";
  progress: number;
  successAccounts: number;
  failedAccounts: string[];
  missingFields: string[];
  benchmarkMode: "auto" | "manual";
};
