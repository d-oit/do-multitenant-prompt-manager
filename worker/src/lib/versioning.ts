/**
 * API Versioning utilities
 */

export const API_VERSION = "1.0.0";
export const SUPPORTED_VERSIONS = ["v1"];

/**
 * Normalize a path by removing version prefix if present
 * Examples:
 *   /v1/prompts -> /prompts
 *   /prompts -> /prompts
 *   /v1/auth/login -> /auth/login
 */
export function normalizeVersionedPath(path: string): {
  normalizedPath: string;
  version: string | null;
} {
  const versionMatch = path.match(/^\/v(\d+)(\/.*)?$/);

  if (versionMatch) {
    const version = `v${versionMatch[1]}`;
    const normalizedPath = versionMatch[2] || "/";

    return { normalizedPath, version };
  }

  return { normalizedPath: path, version: null };
}

/**
 * Extract API version from request headers or path
 * Priority: Path version > Accept-Version header > Default (v1)
 */
export function getRequestedVersion(request: Request, path: string): string {
  const { version: pathVersion } = normalizeVersionedPath(path);

  if (pathVersion) {
    return pathVersion;
  }

  const acceptVersion = request.headers.get("Accept-Version");
  if (acceptVersion && SUPPORTED_VERSIONS.includes(acceptVersion)) {
    return acceptVersion;
  }

  return "v1"; // Default version
}

/**
 * Check if a version is supported
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version);
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(response: Response, version: string): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("API-Version", version);
  newHeaders.set("API-Version-Info", API_VERSION);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
