import { describe, it, expect } from "vitest";
import {
  normalizeVersionedPath,
  getRequestedVersion,
  isVersionSupported,
  addVersionHeaders,
  API_VERSION,
  SUPPORTED_VERSIONS
} from "./versioning";

describe("normalizeVersionedPath", () => {
  it("extracts version from /v1/ prefix", () => {
    const result = normalizeVersionedPath("/v1/prompts");

    expect(result.version).toBe("v1");
    expect(result.normalizedPath).toBe("/prompts");
  });

  it("handles /v1 without trailing path", () => {
    const result = normalizeVersionedPath("/v1");

    expect(result.version).toBe("v1");
    expect(result.normalizedPath).toBe("/");
  });

  it("returns null version for non-versioned paths", () => {
    const result = normalizeVersionedPath("/prompts");

    expect(result.version).toBeNull();
    expect(result.normalizedPath).toBe("/prompts");
  });

  it("handles root path", () => {
    const result = normalizeVersionedPath("/");

    expect(result.version).toBeNull();
    expect(result.normalizedPath).toBe("/");
  });

  it("handles /v2/ prefix", () => {
    const result = normalizeVersionedPath("/v2/prompts");

    expect(result.version).toBe("v2");
    expect(result.normalizedPath).toBe("/prompts");
  });

  it("handles nested paths", () => {
    const result = normalizeVersionedPath("/v1/prompts/123/versions");

    expect(result.version).toBe("v1");
    expect(result.normalizedPath).toBe("/prompts/123/versions");
  });
});

describe("getRequestedVersion", () => {
  it("prioritizes path version over header", () => {
    const request = new Request("http://example.com/v1/prompts", {
      headers: { "Accept-Version": "v2" }
    });

    const version = getRequestedVersion(request, "/v1/prompts");

    expect(version).toBe("v1");
  });

  it("uses Accept-Version header when no path version", () => {
    const request = new Request("http://example.com/prompts", {
      headers: { "Accept-Version": "v1" }
    });

    const version = getRequestedVersion(request, "/prompts");

    expect(version).toBe("v1");
  });

  it("returns default v1 when neither path nor header present", () => {
    const request = new Request("http://example.com/prompts");

    const version = getRequestedVersion(request, "/prompts");

    expect(version).toBe("v1");
  });

  it("ignores unsupported Accept-Version header", () => {
    const request = new Request("http://example.com/prompts", {
      headers: { "Accept-Version": "v99" }
    });

    const version = getRequestedVersion(request, "/prompts");

    expect(version).toBe("v1");
  });
});

describe("isVersionSupported", () => {
  it("returns true for supported versions", () => {
    SUPPORTED_VERSIONS.forEach((version) => {
      expect(isVersionSupported(version)).toBe(true);
    });
  });

  it("returns false for unsupported versions", () => {
    expect(isVersionSupported("v99")).toBe(false);
    expect(isVersionSupported("v0")).toBe(false);
    expect(isVersionSupported("invalid")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isVersionSupported("V1")).toBe(false);
    expect(isVersionSupported("v1")).toBe(true);
  });
});

describe("addVersionHeaders", () => {
  it("adds API-Version header", () => {
    const response = new Response("test");

    const updatedResponse = addVersionHeaders(response, "v1");

    expect(updatedResponse.headers.get("API-Version")).toBe("v1");
  });

  it("adds API-Version-Info header", () => {
    const response = new Response("test");

    const updatedResponse = addVersionHeaders(response, "v1");

    expect(updatedResponse.headers.get("API-Version-Info")).toBe(API_VERSION);
  });

  it("preserves original response body and status", async () => {
    const response = new Response("test content", { status: 201 });

    const updatedResponse = addVersionHeaders(response, "v1");

    expect(updatedResponse.status).toBe(201);
    expect(await updatedResponse.text()).toBe("test content");
  });

  it("preserves existing headers", () => {
    const response = new Response("test", {
      headers: { "Content-Type": "application/json" }
    });

    const updatedResponse = addVersionHeaders(response, "v1");

    expect(updatedResponse.headers.get("Content-Type")).toBe("application/json");
  });
});

describe("API_VERSION constant", () => {
  it("is a valid version string", () => {
    expect(API_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("SUPPORTED_VERSIONS constant", () => {
  it("is an array", () => {
    expect(Array.isArray(SUPPORTED_VERSIONS)).toBe(true);
  });

  it("contains at least one version", () => {
    expect(SUPPORTED_VERSIONS.length).toBeGreaterThan(0);
  });

  it("contains v1", () => {
    expect(SUPPORTED_VERSIONS).toContain("v1");
  });
});
