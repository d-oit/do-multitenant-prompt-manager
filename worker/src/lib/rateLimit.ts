import type { Env } from "../types";
import type { Logger } from "./logger";
import { jsonResponse, serializeError } from "./json";

export type RateLimitResult = {
  response: Response;
  clientId: string;
  limit: number;
  windowSeconds: number;
};

const encoder = new TextEncoder();

export async function enforceRateLimit(
  request: Request,
  env: Env,
  logger: Logger,
  requestId: string
): Promise<RateLimitResult | null> {
  const maxRequests = parsePositiveInt(env.RATE_LIMIT_MAX_REQUESTS, 600);
  const windowSeconds = parsePositiveInt(env.RATE_LIMIT_WINDOW_SECONDS, 60);

  if (maxRequests <= 0 || windowSeconds <= 0) {
    return null;
  }

  const clientId = await resolveRateLimitIdentifier(request);
  if (!clientId) {
    return null;
  }

  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `ratelimit:${clientId}:${bucket}`;

  try {
    const currentRaw = await env.PROMPT_CACHE.get(key);
    let currentCount = currentRaw ? Number.parseInt(currentRaw, 10) : 0;

    if (!Number.isFinite(currentCount) || currentCount < 0) {
      currentCount = 0;
    }

    if (currentCount >= maxRequests) {
      const response = jsonResponse({ error: "Too Many Requests" }, 429);
      response.headers.set("Retry-After", String(windowSeconds));
      response.headers.set("X-RateLimit-Limit", String(maxRequests));
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", String((bucket + 1) * windowSeconds));
      return {
        response,
        clientId,
        limit: maxRequests,
        windowSeconds
      };
    }

    await env.PROMPT_CACHE.put(key, String(currentCount + 1), {
      expirationTtl: windowSeconds
    });
    return null;
  } catch (error) {
    logger.error("security.rate_limit_error", {
      requestId,
      clientId,
      error: serializeError(error)
    });
    return null;
  }
}

export function getClientIdentifier(request: Request): string {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) {
    return direct;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first && first.trim()) {
      return first.trim();
    }
  }

  const ipHeader = request.headers.get("x-real-ip");
  if (ipHeader) {
    return ipHeader;
  }

  return "anonymous";
}

async function resolveRateLimitIdentifier(request: Request): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const key = apiKey.trim();
    if (key) {
      const digest = await crypto.subtle.digest("SHA-256", encoder.encode(key));
      const hash = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      return `api-key:${hash}`;
    }
  }

  return getClientIdentifier(request);
}

export function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
