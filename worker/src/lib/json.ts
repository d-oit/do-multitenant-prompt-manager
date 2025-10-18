export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string | string[]>
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      if (Array.isArray(v)) {
        for (const vv of v) headers.append(k, vv);
      } else {
        headers.set(k, v);
      }
    }
  }
  return new Response(JSON.stringify(body), {
    status,
    headers
  });
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw jsonResponse({ error: "Expected application/json content-type" }, 415);
  }

  return request.json();
}

export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse JSON column", error);
    return fallback;
  }
}

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  if (typeof error === "object" && error !== null) {
    return { ...error } as Record<string, unknown>;
  }

  return { message: String(error) };
}
