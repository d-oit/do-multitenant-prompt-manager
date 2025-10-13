export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface Logger {
  level: LogLevel;
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

export function createLogger(levelInput?: string): Logger {
  const normalized = (levelInput || "info").toLowerCase() as LogLevel;
  const allowed: LogLevel[] = ["debug", "info", "warn", "error", "silent"];
  const level = allowed.includes(normalized) ? normalized : "info";

  const shouldLog = (messageLevel: LogLevel) => {
    const order: Record<LogLevel, number> = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40,
      silent: 50
    };
    return order[messageLevel] >= order[level];
  };

  const log = (messageLevel: LogLevel, message: string, context?: Record<string, unknown>) => {
    if (!shouldLog(messageLevel)) {
      return;
    }

    const payload = context ? { ...context } : undefined;
    switch (messageLevel) {
      case "debug":
        console.debug(message, payload);
        break;
      case "info":
        console.info(message, payload);
        break;
      case "warn":
        console.warn(message, payload);
        break;
      case "error":
        console.error(message, payload);
        break;
      default:
        break;
    }
  };

  return {
    level,
    debug: (message, context) => log("debug", message, context),
    info: (message, context) => log("info", message, context),
    warn: (message, context) => log("warn", message, context),
    error: (message, context) => log("error", message, context)
  };
}
