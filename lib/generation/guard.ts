// /api/generate 남용 방지. 배포 후 URL만 알면 누구나 API 크레딧을 쓸 수 있으므로 최소한의 문을 단다.
// 서버리스 환경에서는 인스턴스마다 기록이 따로라 완벽하지 않다. 비용 상한은 Anthropic Console에서도 걸어 둘 것.

// 이 사이트의 페이지에서 보낸 요청만 받는다 (브라우저는 POST에 Origin을 붙인다)
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// 키(IP, 세션 등)별로 windowMs 안에 max번까지만 허용하는 간단한 메모리 리미터
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);
    return false;
  };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

// 참가자 한 명은 Part 2에서 몇 번만 요청하므로, IP당 10분에 10번이면 충분하다
const generateLimiter = createRateLimiter(10 * 60 * 1000, 10);

export function isRateLimited(request: Request): boolean {
  return generateLimiter(clientIp(request));
}
