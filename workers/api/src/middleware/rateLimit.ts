interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
};

const HEAVY_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 10,
};

const heavyPaths = ["/api/research/compare-links", "/api/research/keyword-search"];

const store = new Map<string, RateLimitEntry>();

function getClientIp(request: Request): string {
  const cf = (request as unknown as { cf?: { connectingIp?: string } }).cf;
  if (cf?.connectingIp) return cf.connectingIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

function getConfigForPath(pathname: string): RateLimitConfig {
  for (const heavy of heavyPaths) {
    if (pathname.startsWith(heavy)) return HEAVY_CONFIG;
  }
  return DEFAULT_CONFIG;
}

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 120_000) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(request: Request): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  const ip = getClientIp(request);
  const url = new URL(request.url);
  const config = getConfigForPath(url.pathname);
  const key = `${ip}:${config.windowMs}:${config.maxRequests}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = { count: 0, windowStart: now };
    store.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetAt = entry.windowStart + config.windowMs;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining, resetAt };
}

export function rateLimitMiddleware(request: Request): Response | null {
  const result = checkRateLimit(request);
  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: { code: "RATE_LIMITED", message: "Too many requests", details: null } }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "x-ratelimit-remaining": "0",
        },
      }
    );
  }
  return null;
}

export { DEFAULT_CONFIG, HEAVY_CONFIG, getClientIp, getConfigForPath, store };
