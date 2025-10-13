/* eslint-disable no-console */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logError, logWarn, logInfo } from "./logger";

describe("logger", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  describe("logError", () => {
    it("logs error message", () => {
      const error = new Error("Test error");
      logError("Error message", error);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.any(String),
        "Error message",
        expect.objectContaining({ error: expect.any(Object) })
      );
    });

    it("logs error with context", () => {
      const error = new Error("Test error");
      const context = { requestId: "123", userId: "456" };
      logError("Error with context", error, context);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.any(String),
        "Error with context",
        expect.objectContaining({
          requestId: "123",
          userId: "456",
          error: expect.any(Object)
        })
      );
    });

    it("handles string errors", () => {
      logError("String payload", "String error");
      expect(errorSpy).toHaveBeenCalledWith(
        expect.any(String),
        "String payload",
        expect.objectContaining({ error: { message: "String error" } })
      );
    });
  });

  describe("logWarn", () => {
    it("logs warning message", () => {
      logWarn("Warning message");
      expect(warnSpy).toHaveBeenCalledWith(expect.any(String), "Warning message", undefined);
    });

    it("logs warning with context", () => {
      const context = { attemptNumber: 3 };
      logWarn("Retry attempt", context);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.any(String),
        "Retry attempt",
        expect.objectContaining({ attemptNumber: 3 })
      );
    });
  });

  describe("logInfo", () => {
    it("logs info message", () => {
      logInfo("Info message");
      expect(infoSpy).toHaveBeenCalledWith(expect.any(String), "Info message", undefined);
    });

    it("logs info with context", () => {
      const context = { userId: "123" };
      logInfo("User action", context);
      expect(infoSpy).toHaveBeenCalledWith(
        expect.any(String),
        "User action",
        expect.objectContaining({ userId: "123" })
      );
    });
  });
});
