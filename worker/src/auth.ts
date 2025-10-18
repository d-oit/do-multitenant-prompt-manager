import { SignJWT, jwtVerify } from "jose";

import { DEFAULT_ACCESS_TOKEN_TTL_SECONDS, DEFAULT_REFRESH_TOKEN_TTL_SECONDS } from "./constants";
import { jsonResponse } from "./lib/json";
import type { Env } from "./types";

const encoder = new TextEncoder();

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}

export interface RoleAssignment {
  roleId: string;
  roleName: string;
  permissions: string[];
  tenantId: string | null;
}

export interface AuthContext {
  user: AuthenticatedUser;
  roles: RoleAssignment[];
  globalPermissions: Set<string>;
  tenantPermissions: Map<string, Set<string>>;
  source: "jwt" | "api-key" | "jwt-cookie";
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

interface RoleRow {
  role_id: string;
  role_name: string;
  permissions: string;
  tenant_id: string | null;
}

interface ApiKeyRow {
  id: string;
  user_id: string;
  role_id: string;
  tenant_id: string | null;
  name: string;
  key_hash: string;
  created_at: string;
  last_used_at: string | null;
  revoked: number;
  role_name: string;
  permissions: string;
  email: string;
  user_name: string | null;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked: number;
}

export interface AuthOptions {
  optional?: boolean;
}

export interface SessionTokens {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const API_KEY_BYTES = 32;

export async function hashPassword(password: string, salt?: Uint8Array): Promise<string> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: ITERATIONS,
      salt: saltBytes
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const derived = new Uint8Array(derivedBits);
  return `${bytesToHex(saltBytes)}$${bytesToHex(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltPart, hashPart] = stored.split("$");
  if (!saltPart || !hashPart) {
    return false;
  }
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = hexToBytes(saltPart);
    expected = hexToBytes(hashPart);
  } catch {
    return false;
  }
  const candidate = await hashPassword(password, salt);
  const [, candidateHash] = candidate.split("$");
  if (!candidateHash) {
    return false;
  }
  let candidateBytes: Uint8Array;
  try {
    candidateBytes = hexToBytes(candidateHash);
  } catch {
    return false;
  }
  return subtleTimingSafeEqual(candidateBytes, expected);
}

export async function authenticateRequest(
  request: Request,
  env: Env,
  options: AuthOptions = {}
): Promise<AuthContext | null> {
  // E2E test mode bypass - allows unauthenticated access with full permissions
  if (env.E2E_TEST_MODE === "true") {
    console.log("🧪 E2E_TEST_MODE enabled - bypassing authentication");
    const testUser: AuthenticatedUser = {
      id: "e2e-test-user",
      email: "e2e@test.local",
      name: "E2E Test User"
    };
    const testRole: RoleAssignment = {
      roleId: "e2e-test-role",
      roleName: "E2E Test Admin",
      permissions: ["*"],
      tenantId: null
    };
    return buildAuthContext(testUser, [testRole], "jwt");
  }

  console.log("🔐 Authentication request:", {
    path: request.url,
    method: request.method,
    authHeader: request.headers.get("authorization"),
    cookieHeader: request.headers.get("cookie"),
    apiKeyHeader: request.headers.get("x-api-key"),
    e2eMode: env.E2E_TEST_MODE
  });

  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  // Enhanced authentication priority: API Key > Bearer Token > Cookie
  if (apiKeyHeader) {
    const context = await authenticateApiKey(apiKeyHeader.trim(), env);
    if (context) {
      console.log("🔐 API Key authentication successful for user:", context.user.email);
      return context;
    }
  }

  // Check for Bearer token first (preferred for API clients)
  let bearerToken: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    bearerToken = authHeader.slice(7).trim();
  }

  // Fall back to cookies for web browser clients
  let cookieAccessToken: string | null = null;
  const cookieHeader = request.headers.get("cookie");
  if (!bearerToken && cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies.pm_access) {
      cookieAccessToken = cookies.pm_access;
    }
  }

  const token = bearerToken || cookieAccessToken;
  if (token) {
    console.log("🔐 JWT token found:", token.substring(0, 20) + "...");
    const payload = await verifyJwt(token, getAccessTokenSecret(env));
    if (!payload?.sub || typeof payload.sub !== "string") {
      console.log("🔐 JWT verification failed - invalid payload or missing sub");
      throw jsonResponse({ error: "Unauthorized" }, 401);
    }
    console.log("🔐 JWT verified - user ID:", payload.sub);
    const user = await fetchUser(env, payload.sub);
    if (!user) {
      console.log("🔐 User not found for ID:", payload.sub);
      throw jsonResponse({ error: "Unauthorized" }, 401);
    }
    const assignments = await fetchRoleAssignments(env, user.id);
    console.log("🔐 Authentication successful for user:", user.email);
    return buildAuthContext(user, assignments, bearerToken ? "jwt" : "jwt-cookie");
  }

  if (options.optional) {
    console.log("🔐 Optional authentication - returning null");
    return null;
  }

  console.log("🔐 No authentication method found - returning 401");
  throw jsonResponse({ error: "Unauthorized" }, 401);
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export async function generateSessionTokens(env: Env, userId: string): Promise<SessionTokens> {
  const accessTtl = parseInteger(env.ACCESS_TOKEN_TTL_SECONDS, DEFAULT_ACCESS_TOKEN_TTL_SECONDS);
  const refreshTtl = parseInteger(env.REFRESH_TOKEN_TTL_SECONDS, DEFAULT_REFRESH_TOKEN_TTL_SECONDS);

  const accessTokenExpiresAt = new Date(Date.now() + accessTtl * 1000);
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTtl * 1000);

  const accessToken = await signJwt(
    {
      sub: userId,
      type: "access"
    },
    getAccessTokenSecret(env),
    accessTtl
  );

  const refreshToken = await generateRefreshToken(env, userId, refreshTokenExpiresAt);

  return {
    accessToken,
    accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
    refreshToken: refreshToken.token,
    refreshTokenExpiresAt: refreshToken.expiresAt
  };
}

export async function invalidateRefreshToken(env: Env, token: string): Promise<void> {
  const hash = await sha256(token);
  await env.DB.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?")
    .bind(hash)
    .run();
}

export async function authenticateRefreshToken(
  env: Env,
  token: string
): Promise<RefreshTokenRow | null> {
  const hash = await sha256(token);
  const record = await env.DB.prepare(
    "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0"
  )
    .bind(hash)
    .first<RefreshTokenRow>();

  if (!record) {
    return null;
  }

  const expiresAt = new Date(record.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await env.DB.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?")
      .bind(record.id)
      .run();
    return null;
  }

  return record;
}

export async function revokeUserRefreshTokens(env: Env, userId: string): Promise<void> {
  await env.DB.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?")
    .bind(userId)
    .run();
}

export async function fetchUser(env: Env, id: string): Promise<AuthenticatedUser | null> {
  const row = await env.DB.prepare("SELECT id, email, name FROM users WHERE id = ?")
    .bind(id)
    .first<UserRow>();
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name
  };
}

export async function fetchUserByEmailWithPassword(
  env: Env,
  email: string
): Promise<{ user: AuthenticatedUser; passwordHash: string } | null> {
  const row = await env.DB.prepare(
    "SELECT id, email, name, password_hash FROM users WHERE email = ? COLLATE NOCASE"
  )
    .bind(email)
    .first<UserRow>();
  if (!row) {
    return null;
  }
  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name
    },
    passwordHash: row.password_hash
  };
}

export async function authenticateApiKey(key: string, env: Env): Promise<AuthContext | null> {
  const hash = await sha256(key);
  const row = await env.DB.prepare(
    `SELECT ak.*, r.name as role_name, r.permissions, u.email, u.name as user_name
     FROM api_keys ak
     JOIN roles r ON ak.role_id = r.id
     JOIN users u ON ak.user_id = u.id
     WHERE ak.key_hash = ? AND ak.revoked = 0`
  )
    .bind(hash)
    .first<ApiKeyRow>();

  if (!row) {
    return null;
  }

  await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), row.id)
    .run();

  const assignments: RoleAssignment[] = [
    {
      roleId: row.role_id,
      roleName: row.role_name,
      permissions: JSON.parse(row.permissions) as string[],
      tenantId: row.tenant_id ?? null
    }
  ];

  const user: AuthenticatedUser = {
    id: row.user_id,
    email: row.email,
    name: row.user_name
  };

  return buildAuthContext(user, assignments, "api-key");
}

export async function fetchRoleAssignments(env: Env, userId: string): Promise<RoleAssignment[]> {
  const rows = await env.DB.prepare(
    `SELECT ur.role_id, ur.tenant_id, r.name as role_name, r.permissions
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ?`
  )
    .bind(userId)
    .all<RoleRow>();

  return (rows.results ?? []).map((row) => ({
    roleId: row.role_id,
    roleName: row.role_name,
    permissions: JSON.parse(row.permissions) as string[],
    tenantId: row.tenant_id ?? null
  }));
}

export function buildAuthContext(
  user: AuthenticatedUser,
  assignments: RoleAssignment[],
  source: "jwt" | "api-key" | "jwt-cookie"
): AuthContext {
  const globalPermissions = new Set<string>();
  const tenantPermissions = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    if (assignment.tenantId) {
      if (!tenantPermissions.has(assignment.tenantId)) {
        tenantPermissions.set(assignment.tenantId, new Set<string>());
      }
      const tenantSet = tenantPermissions.get(assignment.tenantId)!;
      assignment.permissions.forEach((perm) => tenantSet.add(perm));
    } else {
      assignment.permissions.forEach((perm) => globalPermissions.add(perm));
    }
  }

  return {
    user,
    roles: assignments,
    globalPermissions,
    tenantPermissions,
    source
  };
}

export function hasPermission(
  context: AuthContext,
  permission: string,
  tenantId?: string | null
): boolean {
  if (
    context.globalPermissions.has("*") ||
    context.tenantPermissions.get(tenantId ?? "")?.has("*")
  ) {
    return true;
  }

  if (tenantId) {
    const tenantPerms = context.tenantPermissions.get(tenantId);
    if (tenantPerms && (tenantPerms.has(permission) || tenantPerms.has("*"))) {
      return true;
    }
  }

  if (context.globalPermissions.has(permission) || context.globalPermissions.has("*")) {
    return true;
  }

  return false;
}

export function requirePermission(
  context: AuthContext,
  permission: string,
  tenantId?: string | null
): void {
  if (!hasPermission(context, permission, tenantId)) {
    throw jsonResponse({ error: "Forbidden" }, 403);
  }
}

export function ensureTenantAccess(context: AuthContext, tenantId: string): void {
  if (context.globalPermissions.has("*")) {
    return;
  }

  if (context.tenantPermissions.size === 0) {
    throw jsonResponse({ error: "Forbidden" }, 403);
  }

  if (!context.tenantPermissions.has(tenantId)) {
    throw jsonResponse({ error: "Forbidden" }, 403);
  }
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

async function generateRefreshToken(
  env: Env,
  userId: string,
  expiresAt: Date
): Promise<{ token: string; expiresAt: string }> {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToHex(randomBytes);
  const hash = await sha256(token);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, created_at, expires_at, revoked)
     VALUES (?, ?, ?, ?, ?, 0)`
  )
    .bind(id, userId, hash, createdAt, expiresAt.toISOString())
    .run();

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  ttlSeconds: number
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const key = encoder.encode(secret);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ttlSeconds)
    .sign(key);
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), { algorithms: ["HS256"] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function sha256(input: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return bytesToHex(new Uint8Array(hashBuffer));
}

function subtleTimingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

function getAccessTokenSecret(env: Env): string {
  const secret = env.JWT_SECRET?.trim();
  if (!secret) {
    throw jsonResponse({ error: "Server configuration error" }, 500);
  }
  return secret;
}

export async function revokeApiKey(env: Env, apiKeyId: string): Promise<void> {
  await env.DB.prepare("UPDATE api_keys SET revoked = 1 WHERE id = ?").bind(apiKeyId).run();
}

async function generateApiKeySecret(): Promise<{ key: string; hash: string }> {
  const rawKeyBytes = crypto.getRandomValues(new Uint8Array(API_KEY_BYTES));
  const key = bytesToHex(rawKeyBytes);
  const hash = await sha256(key);
  return { key, hash };
}

export async function createApiKey(
  env: Env,
  userId: string,
  roleId: string,
  tenantId: string | null,
  name: string
): Promise<{ id: string; key: string }> {
  const { key, hash } = await generateApiKeySecret();
  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO api_keys (id, user_id, role_id, tenant_id, name, key_hash, created_at, revoked)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)`
  )
    .bind(id, userId, roleId, tenantId, name, hash)
    .run();

  return { id, key };
}

export async function rotateApiKey(env: Env, apiKeyId: string): Promise<string> {
  const { key, hash } = await generateApiKeySecret();
  await env.DB.prepare(
    "UPDATE api_keys SET key_hash = ?, revoked = 0, last_used_at = NULL WHERE id = ?"
  )
    .bind(hash, apiKeyId)
    .run();
  return key;
}

/**
 * Generate a bearer token specifically for API clients
 * This creates a JWT token without cookies, suitable for bearer token authentication
 */
export async function generateBearerToken(
  env: Env,
  userId: string,
  expiresIn?: number
): Promise<{ token: string; expiresAt: string }> {
  const accessTtl =
    expiresIn ?? parseInteger(env.ACCESS_TOKEN_TTL_SECONDS, DEFAULT_ACCESS_TOKEN_TTL_SECONDS);
  const expiresAt = new Date(Date.now() + accessTtl * 1000);

  const token = await signJwt(
    {
      sub: userId,
      type: "access",
      tokenType: "bearer" // Distinguish from cookie-based tokens
    },
    getAccessTokenSecret(env),
    accessTtl
  );

  return {
    token,
    expiresAt: expiresAt.toISOString()
  };
}

export { getAccessTokenSecret };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.trim();
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const result = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    const value = Number.parseInt(normalized.slice(i, i + 2), 16);
    if (Number.isNaN(value)) {
      throw new Error("Invalid hex value");
    }
    result[i / 2] = value;
  }
  return result;
}
