"use client";

import ReactECharts from "echarts-for-react";
import { RadarMetric } from "@/lib/types";

export default function RadarChart({ data }: { data: RadarMetric[] }) {
  const option = {
    tooltip: {},
    radar: {
      indicator: data.map((item) => ({ name: item.name, max: 100 })),
      splitArea: { areaStyle: { color: ["#f8fafc", "#eef6ff"] } },
      axisName: { color: "#475569" }
    },
    series: [
      {
        type: "radar",
        data: [{ value: data.map((item) => Math.round(item.value)), name: "账号能力" }],
        areaStyle: { color: "rgba(45, 132, 255, 0.25)" },
        lineStyle: { color: "#2d84ff", width: 3 },
        itemStyle: { color: "#2d84ff" }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: 320, width: "100%" }} />;
}
