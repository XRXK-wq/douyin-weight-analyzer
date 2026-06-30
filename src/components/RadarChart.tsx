"use client";

import ReactECharts from "echarts-for-react";
import { RadarMetric } from "@/lib/types";

export default function RadarChart({ data }: { data: RadarMetric[] }) {
  const option = {
    tooltip: { backgroundColor: "#1a1a2e", textStyle: { color: "#fff", fontSize: 12 } },
    radar: {
      indicator: data.map((item) => ({ name: item.name, max: 100 })),
      splitArea: { areaStyle: { color: ["#fafafa", "#f0f4ff"] } },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
      axisName: { color: "#64748b", fontSize: 12 },
      shape: "polygon"
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: data.map((item) => Math.round(item.value)),
            name: "账号能力",
            areaStyle: { color: "rgba(254, 44, 85, 0.15)" },
            lineStyle: { color: "#fe2c55", width: 2 },
            itemStyle: { color: "#fe2c55", borderColor: "#fff", borderWidth: 2 }
          }
        ]
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: 300, width: "100%" }} />;
}
