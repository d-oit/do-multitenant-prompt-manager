/**
 * Security headers for the application
 */

export interface SecurityHeadersConfig {
  enableHSTS?: boolean;
  enableCSP?: boolean;
  enableCORP?: boolean;
  enableCOEP?: boolean;
  reportUri?: string;
}

/**
 * Get security headers for responses
 */
export function getSecurityHeaders(config: SecurityHeadersConfig = {}): Headers {
  const {
    enableHSTS = true,
    enableCSP = true,
    enableCORP = true,
    enableCOEP = false,
    reportUri
  } = config;

  const headers = new Headers();

  // Strict Transport Security
  if (enableHSTS) {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy
  if (enableCSP) {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.cloudflare.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ];

    if (reportUri) {
      cspDirectives.push(`report-uri ${reportUri}`);
    }

    headers.set('Content-Security-Policy', cspDirectives.join('; '));
  }

  // X-Content-Type-Options
  headers.set('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  headers.set('X-Frame-Options', 'DENY');

  // X-XSS-Protection (legacy, but still useful)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // Cross-Origin-Embedder-Policy
  if (enableCOEP) {
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }

  // Cross-Origin-Opener-Policy
  if (enableCORP) {
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // Cross-Origin-Resource-Policy
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // Remove potentially sensitive headers
  headers.set('X-Powered-By', ''); // Remove if present
  headers.set('Server', 'Cloudflare'); // Generic server header

  return headers;
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(
  response: Response,
  config?: SecurityHeadersConfig
): Response {
  const securityHeaders = getSecurityHeaders(config);
  const newHeaders = new Headers(response.headers);

  for (const [key, value] of securityHeaders.entries()) {
    if (value) {
      newHeaders.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Get CORS headers
 */
export function getCORSHeaders(origin?: string): Headers {
  const headers = new Headers();

  // Allow specific origin or wildcard
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept-Version');
  headers.set('Access-Control-Expose-Headers', 'API-Version, API-Version-Info, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  headers.set('Access-Control-Allow-Credentials', 'true');

  return headers;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  limit: number,
  remaining: number,
  reset: number
): Response {
  const newHeaders = new Headers(response.headers);
  
  newHeaders.set('X-RateLimit-Limit', String(limit));
  newHeaders.set('X-RateLimit-Remaining', String(remaining));
  newHeaders.set('X-RateLimit-Reset', String(reset));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Create a secure response with all recommended headers
 */
export function createSecureResponse(
  body: BodyInit | null,
  init?: ResponseInit,
  securityConfig?: SecurityHeadersConfig
): Response {
  const response = new Response(body, init);
  return addSecurityHeaders(response, securityConfig);
}
