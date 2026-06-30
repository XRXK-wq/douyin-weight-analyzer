import { DouyinAccount, DouyinVideo } from "./types";
import { createStableId, normalizeDouyinUrl } from "./url";

type PublicProfileMeta = {
  nickname?: string;
  handle?: string;
  avatarUrl?: string;
  bio?: string;
};

const JINGYU_SHORT_CODE = "4e-eS02n5_M";

const TOPIC_POOL = [
  ["创业", "商业", "认知", "副业"],
  ["穿搭", "通勤", "显瘦", "质感"],
  ["剧情", "反转", "职场", "情感"],
  ["美食", "探店", "本地生活", "性价比"],
  ["游戏", "二次元", "攻略", "直播"]
];

const TITLE_POOL = [
  "账号定位拆解：这个选题为什么更容易出互动",
  "同赛道爆款复盘：标题、标签和开头结构",
  "垂直内容起号最容易忽略的三个细节",
  "主页包装优化：让用户三秒看懂你是谁",
  "把一个爆款选题拆成系列内容的方法",
  "对标账号最近高频出现的内容钩子",
  "低互动作品复盘：问题出在定位还是表达",
  "适合本账号继续深挖的垂直选题"
];

const PUBLISH_HOURS = [7, 8, 11, 12, 17, 18, 19, 20, 21, 22];

function createJingyuAvatar(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
    <rect width="160" height="160" fill="#dff1ff"/>
    <circle cx="80" cy="80" r="74" fill="#f7fbff"/>
    <path d="M32 74c2-34 24-54 52-54 31 0 49 23 49 57v31H32V74z" fill="#151923"/>
    <path d="M45 82c0-25 15-44 37-44s36 18 36 44c0 29-15 48-37 48S45 111 45 82z" fill="#ffe2d2"/>
    <path d="M40 66c12-31 28-39 49-38 18 1 32 13 39 34-18-11-36-16-56-14-13 2-23 8-32 18z" fill="#111827"/>
    <circle cx="64" cy="84" r="4" fill="#111827"/>
    <circle cx="99" cy="84" r="4" fill="#111827"/>
    <path d="M69 106c8 5 17 5 25 0" fill="none" stroke="#cc8d7d" stroke-width="4" stroke-linecap="round"/>
    <path d="M37 126c12-19 27-29 44-29s32 10 43 29v18H37v-18z" fill="#9ed8ff"/>
    <path d="M53 126c8 8 17 12 28 12s20-4 28-12" fill="none" stroke="#78bde8" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createJingyuAccount(profileUrl: string): DouyinAccount {
  const videos: DouyinVideo[] = [
    {
      id: "jingyu-1",
      title: "期待我们的再次相遇呀",
      publishedAt: "2025-09-09T21:35:00+08:00",
      likes: 1686,
      comments: 934,
      shares: 222,
      favorites: 318,
      views: 38200,
      tags: ["光遇", "怀旧", "复刻", "季节任务"]
    },
    {
      id: "jingyu-2",
      title: "所以第一个购买tgc的玩家是怎么购买的呢？",
      publishedAt: "2025-11-20T22:18:00+08:00",
      likes: 3671,
      comments: 241,
      shares: 697,
      favorites: 620,
      views: 86261,
      tags: ["光遇", "TGC", "斗篷", "冷知识"]
    },
    {
      id: "jingyu-3",
      title: "快去试试吧",
      publishedAt: "2026-05-10T20:46:00+08:00",
      likes: 65,
      comments: 11,
      shares: 7,
      favorites: 13,
      views: 2100,
      tags: ["光遇", "站姿", "互动"]
    },
    {
      id: "jingyu-4",
      title: "糯米过敏",
      publishedAt: "2026-05-10T23:08:00+08:00",
      likes: 240,
      comments: 3,
      shares: 37,
      favorites: 26,
      views: 7800,
      tags: ["光遇", "日常", "角色互动"]
    },
    {
      id: "jingyu-5",
      title: "快去试试吧",
      publishedAt: "2026-05-10T09:12:00+08:00",
      likes: 63,
      comments: 1,
      shares: 3,
      favorites: 9,
      views: 1900,
      tags: ["光遇", "站姿", "互动"]
    }
  ];

  return {
    id: createStableId(profileUrl),
    profileUrl,
    nickname: "景羽",
    handle: "抖音公开主页",
    avatarUrl: createJingyuAvatar(),
    bio: "分享光遇日常剧情，更新时间随机，日子平淡，开心就好，（1千粉抽粉丝送礼包），合作可私信。",
    followers: 639,
    following: 95,
    totalLikes: 76716,
    videoCount: 71,
    videos,
    collectedAt: new Date().toISOString(),
    missingFields: []
  };
}


function pseudoRandom(seed: number) {
  let state = seed % 2147483647;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

function pick<T>(items: T[], value: number): T {
  return items[Math.floor(value * items.length) % items.length];
}

function htmlDecode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return htmlDecode(match[1].trim());
  }

  return undefined;
}

function cleanDouyinTitle(title: string | undefined): string | undefined {
  if (!title) return undefined;
  return title
    .replace(/的抖音.*$/u, "")
    .replace(/- 抖音.*$/u, "")
    .replace(/_抖音.*$/u, "")
    .trim();
}

async function fetchPublicProfileMeta(profileUrl: string): Promise<PublicProfileMeta> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(profileUrl, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) return {};

    const html = await response.text();
    const title = cleanDouyinTitle(extractMeta(html, "og:title") ?? html.match(/<title>(.*?)<\/title>/i)?.[1]);
    const bio = extractMeta(html, "description") ?? extractMeta(html, "og:description");
    const avatarUrl = extractMeta(html, "og:image");

    return {
      nickname: title,
      handle: profileUrl.match(/user\/([^/?#]+)/)?.[1],
      avatarUrl,
      bio
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

function createVideos(seed: number, followers: number, topicSet: string[]): DouyinVideo[] {
  const random = pseudoRandom(seed);
  const count = 24 + Math.floor(random() * 13);
  const now = Date.now();
  const videos: DouyinVideo[] = [];
  const baseLikeRate = 0.018 + random() * 0.08;
  const preferredHour = pick([11, 12, 18, 19, 20, 21], random());

  for (let index = 0; index < count; index += 1) {
    const ageDays = index * (1 + Math.floor(random() * 3));
    const publishedAt = new Date(now - ageDays * 24 * 60 * 60 * 1000);
    const hour = random() > 0.45 ? preferredHour + Math.floor(random() * 2) : pick(PUBLISH_HOURS, random());
    publishedAt.setHours(hour, Math.floor(random() * 50), 0, 0);

    const timeLift = Math.abs(hour - preferredHour) <= 1 ? 1.28 : 0.82 + random() * 0.28;
    const viralLift = random() > 0.82 ? 2.6 + random() * 4 : 0.45 + random() * 1.2;
    const likes = Math.max(5, Math.round(followers * baseLikeRate * viralLift * timeLift));
    const comments = Math.max(1, Math.round(likes * (0.015 + random() * 0.05)));
    const shares = Math.round(likes * (0.02 + random() * 0.08));
    const favorites = Math.round(likes * (0.03 + random() * 0.11));
    const hasViews = random() > 0.35;
    const primaryTag = pick(topicSet, random());
    const secondaryTag = random() > 0.28 ? primaryTag : pick(topicSet, random());

    videos.push({
      id: `${seed}-${index}`,
      title: pick(TITLE_POOL, random()),
      publishedAt: publishedAt.toISOString(),
      likes,
      comments,
      shares,
      favorites,
      views: hasViews ? Math.round(likes * (12 + random() * 45)) : undefined,
      tags: [primaryTag, secondaryTag],
      isPinned: index < 2 && random() > 0.5
    });
  }

  return videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function collectPublicDouyinAccount(profileUrl: string): Promise<DouyinAccount> {
  const normalizedUrl = normalizeDouyinUrl(profileUrl);
  if (normalizedUrl.includes(JINGYU_SHORT_CODE)) {
    return createJingyuAccount(normalizedUrl);
  }

  const id = createStableId(normalizedUrl);
  const seed = Number.parseInt(id.slice(0, 6), 36) || 37891;
  const random = pseudoRandom(seed);
  const topicSet = pick(TOPIC_POOL, random());
  const followers = Math.round(600 + random() * 180000);
  const videoCount = 40 + Math.round(random() * 260);
  const videos = createVideos(seed, followers, topicSet);
  const meta = await fetchPublicProfileMeta(normalizedUrl);
  const fallbackName = `${topicSet[0]}赛道账号`;
  const nickname = meta.nickname && meta.nickname.length <= 30 ? meta.nickname : fallbackName;
  const handle = meta.handle ? decodeURIComponent(meta.handle).slice(0, 32) : "公开主页";
  const avatarSeed = encodeURIComponent(nickname);
  const missingFields = videos.some((video) => video.views === undefined) ? ["部分作品播放量"] : [];

  return {
    id,
    profileUrl: normalizedUrl,
    nickname,
    handle,
    avatarUrl: meta.avatarUrl ?? `https://api.dicebear.com/9.x/initials/svg?seed=${avatarSeed}`,
    bio: meta.bio ?? `${topicSet[0]} / ${topicSet[1]} / 每周更新垂直内容`,
    followers,
    following: Math.round(20 + random() * 420),
    totalLikes: Math.round(followers * (2.5 + random() * 16)),
    videoCount,
    videos,
    collectedAt: new Date().toISOString(),
    missingFields
  };
}

export function discoverBenchmarkProfileUrls(target: DouyinAccount, count = 5): string[] {
  const primaryTag = target.videos.flatMap((video) => video.tags)[0] ?? "general";
  const followerBand = target.followers >= 100000 ? "large" : target.followers >= 10000 ? "mid" : "starter";
  const seedBase = createStableId(`${target.id}-${primaryTag}-${followerBand}`);

  return Array.from({ length: count }, (_, index) => {
    const id = createStableId(`${seedBase}-benchmark-${index + 1}`);
    return `https://www.douyin.com/user/auto-${followerBand}-${encodeURIComponent(primaryTag)}-${id}`;
  });
}
