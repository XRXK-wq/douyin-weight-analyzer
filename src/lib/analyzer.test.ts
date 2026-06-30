import { describe, expect, it } from "vitest";
import { createAnalysisReport } from "./analyzer";
import { collectPublicDouyinAccount, discoverBenchmarkProfileUrls } from "./collector";
import { normalizeDouyinUrl } from "./url";

describe("normalizeDouyinUrl", () => {
  it("accepts douyin user links", () => {
    expect(normalizeDouyinUrl("www.douyin.com/user/demo")).toBe("https://www.douyin.com/user/demo");
  });

  it("rejects non-douyin links", () => {
    expect(() => normalizeDouyinUrl("https://example.com/user/demo")).toThrow("抖音");
  });
});

describe("createAnalysisReport", () => {
  it("discovers automatic benchmark links from a target account", async () => {
    const target = await collectPublicDouyinAccount("https://www.douyin.com/user/auto-target");
    const urls = discoverBenchmarkProfileUrls(target, 5);

    expect(urls).toHaveLength(5);
    expect(urls.every((url) => url.startsWith("https://www.douyin.com/user/auto-"))).toBe(true);
  });

  it("creates a stable report structure with benchmark gaps", async () => {
    const target = await collectPublicDouyinAccount("https://www.douyin.com/user/target-test");
    const benchmarks = await Promise.all([
      collectPublicDouyinAccount("https://www.douyin.com/user/bench-a"),
      collectPublicDouyinAccount("https://www.douyin.com/user/bench-b"),
      collectPublicDouyinAccount("https://www.douyin.com/user/bench-c")
    ]);
    const report = createAnalysisReport(target, benchmarks);

    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.radar).toHaveLength(6);
    expect(report.benchmarkGaps.length).toBeGreaterThan(0);
    expect(report.suggestions.every((item) => item.evidence.length > 0)).toBe(true);
  });

  it("downgrades confidence when benchmark samples are missing", async () => {
    const target = await collectPublicDouyinAccount("https://www.douyin.com/user/low-confidence");
    const report = createAnalysisReport(target, []);

    expect(report.confidence).toBe("low");
    expect(report.benchmarkGaps).toHaveLength(0);
  });
});
