# Project Coding Rules (Non-Obvious Only)

- Always use `safeJsonParse()` from `worker/src/lib/json.ts` instead of direct JSON.parse for database columns (prevents silent failures)
- Always use `serializeError()` from `worker/src/lib/json.ts` for logging error objects (provides structured error data)
- Password hashing uses PBKDF2 with 100k iterations - custom implementation in `worker/src/auth.ts` (not standard crypto libraries)
- Use double quotes (not single quotes) for strings - enforced by prettier config
