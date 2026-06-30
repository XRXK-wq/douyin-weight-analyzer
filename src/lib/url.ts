const DOUYIN_HOSTS = ["douyin.com", "iesdouyin.com"];

export function normalizeDouyinUrl(input: string): string {
  const value = input.trim();
  if (!value) {
    throw new Error("请输入抖音主页链接");
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("链接格式不正确");
  }

  const isDouyin = DOUYIN_HOSTS.some((host) => url.hostname.endsWith(host));
  if (!isDouyin) {
    throw new Error("请填写抖音主页或抖音短链接");
  }

  url.hash = "";
  return url.toString();
}

export function createStableId(input: string): string {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
