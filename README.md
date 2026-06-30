# 抖音账号权重分析与对标系统

内部自用网页后台。输入抖音主页链接后，系统生成账号权重估算、可靠性提示、对标差距和运营建议。

## 当前能力

- 主账号链接分析
- 3-10 个对标账号横向比较
- 权重估算、等级、雷达图、数据完整度、置信度
- 诊断项、差距表、近期作品样本、运营建议
- API：
  - `POST /api/analyze`
  - `GET /api/jobs/:jobId`
  - `GET /api/reports/:reportId`
  - `POST /api/reports/:reportId/supplement`
  - `POST /api/benchmarks/recalculate`

## 重要说明

当前 `src/lib/collector.ts` 是可替换的数据采集适配器，使用主页链接生成稳定演示数据，用来先验证评分、对标、报告和 UI 流程。

接真实数据时，只应处理公开可见数据或授权数据，不实现验证码绕过、登录态绕过或平台风控对抗。报告中的“权重”是运营健康度和推荐潜力估算，不代表抖音官方内部权重。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 测试

```bash
npm test
```
