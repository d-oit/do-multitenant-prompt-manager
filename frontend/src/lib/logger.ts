type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50
};

const namespace = "[PromptManager]";

const configuredLevel = normalizeLevel(import.meta.env.VITE_LOG_LEVEL);

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[configuredLevel];
}

function normalizeLevel(value?: string): LogLevel {
  if (!value) {
    return "info";
  }
  const normalized = value.toLowerCase() as LogLevel;
  return levelOrder[normalized] ? normalized : "info";
}

function sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  const redactedKeys = ["token", "authorization", "password", "secret"];
  const entries = Object.entries(context).map(([key, value]) => {
    const lower = key.toLowerCase();
    const shouldRedact = redactedKeys.some((needle) => lower.includes(needle));
    return [key, shouldRedact ? "[REDACTED]" : value];
  });

  return Object.fromEntries(entries);
}

function formatError(error: unknown): Record<string, unknown> {
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

export function logDebug(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog("debug")) return;
  console.debug(namespace, message, sanitizeContext(context));
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog("info")) return;
  console.info(namespace, message, sanitizeContext(context));
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog("warn")) return;
  console.warn(namespace, message, sanitizeContext(context));
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>): void {
  if (!shouldLog("error")) return;
  const payload = {
    ...sanitizeContext(context),
    error: formatError(error)
  };
  console.error(namespace, message, payload);
}
