import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "抖音账号权重分析",
  description: "内部自用的抖音账号权重估算与对标分析后台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
