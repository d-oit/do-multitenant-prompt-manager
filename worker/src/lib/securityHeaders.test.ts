import { describe, it, expect } from "vitest";
import {
  getSecurityHeaders,
  addSecurityHeaders,
  getCORSHeaders,
  addRateLimitHeaders,
  createSecureResponse
} from "./securityHeaders";

describe("getSecurityHeaders", () => {
  it("returns security headers with defaults", () => {
    const headers = getSecurityHeaders();

    expect(headers.get("Strict-Transport-Security")).toBeTruthy();
    expect(headers.get("Content-Security-Policy")).toBeTruthy();
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-XSS-Protection")).toBe("1; mode=block");
    expect(headers.get("Referrer-Policy")).toBeTruthy();
  });

  it("includes HSTS when enabled", () => {
    const headers = getSecurityHeaders({ enableHSTS: true });

    expect(headers.get("Strict-Transport-Security")).toContain("max-age");
    expect(headers.get("Strict-Transport-Security")).toContain("includeSubDomains");
  });

  it("excludes HSTS when disabled", () => {
    const headers = getSecurityHeaders({ enableHSTS: false });

    expect(headers.get("Strict-Transport-Security")).toBeNull();
  });

  it("includes CSP when enabled", () => {
    const headers = getSecurityHeaders({ enableCSP: true });

    const csp = headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
    expect(csp).toContain("style-src");
  });

  it("includes report-uri in CSP when provided", () => {
    const headers = getSecurityHeaders({
      enableCSP: true,
      reportUri: "https://example.com/csp-report"
    });

    expect(headers.get("Content-Security-Policy")).toContain("report-uri");
  });

  it("includes CORP when enabled", () => {
    const headers = getSecurityHeaders({ enableCORP: true });

    expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });

  it("includes COEP when enabled", () => {
    const headers = getSecurityHeaders({ enableCOEP: true });

    expect(headers.get("Cross-Origin-Embedder-Policy")).toBe("require-corp");
  });

  it("includes permissions policy", () => {
    const headers = getSecurityHeaders();

    const policy = headers.get("Permissions-Policy");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
  });
});

describe("addSecurityHeaders", () => {
  it("adds security headers to response", () => {
    const originalResponse = new Response("test", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });

    const secureResponse = addSecurityHeaders(originalResponse);

    expect(secureResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(secureResponse.headers.get("Content-Type")).toBe("text/plain");
  });

  it("preserves original response body and status", async () => {
    const originalResponse = new Response("test content", { status: 201 });
    const secureResponse = addSecurityHeaders(originalResponse);

    expect(secureResponse.status).toBe(201);
    expect(await secureResponse.text()).toBe("test content");
  });

  it("does not override existing headers", () => {
    const originalResponse = new Response("test", {
      headers: { "Custom-Header": "value" }
    });

    const secureResponse = addSecurityHeaders(originalResponse);

    expect(secureResponse.headers.get("Custom-Header")).toBe("value");
  });
});

describe("getCORSHeaders", () => {
  it("returns CORS headers with default origin", () => {
    const headers = getCORSHeaders();

    expect(headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(headers.get("Access-Control-Allow-Methods")).toBeTruthy();
    expect(headers.get("Access-Control-Allow-Headers")).toBeTruthy();
  });

  it("returns CORS headers with specific origin", () => {
    const headers = getCORSHeaders("https://example.com");

    expect(headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
  });

  it("includes credentials header", () => {
    const headers = getCORSHeaders();

    expect(headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("includes expose headers", () => {
    const headers = getCORSHeaders();

    const exposeHeaders = headers.get("Access-Control-Expose-Headers");
    expect(exposeHeaders).toContain("API-Version");
    expect(exposeHeaders).toContain("X-RateLimit-Limit");
  });
});

describe("addRateLimitHeaders", () => {
  it("adds rate limit headers to response", () => {
    const response = new Response("test");
    const now = Math.floor(Date.now() / 1000);

    const updatedResponse = addRateLimitHeaders(response, 100, 50, now + 3600);

    expect(updatedResponse.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(updatedResponse.headers.get("X-RateLimit-Remaining")).toBe("50");
    expect(updatedResponse.headers.get("X-RateLimit-Reset")).toBe(String(now + 3600));
  });
});

describe("createSecureResponse", () => {
  it("creates response with security headers", () => {
    const response = createSecureResponse("test content", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.status).toBe(200);
  });

  it("allows custom security configuration", () => {
    const response = createSecureResponse("test", undefined, {
      enableHSTS: false,
      enableCSP: false
    });

    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
  });
});
