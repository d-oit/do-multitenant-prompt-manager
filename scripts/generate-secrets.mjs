import { randomBytes } from "node:crypto";

function generateSecret() {
  return randomBytes(32).toString("hex");
}

console.log("🔐 Generating secure secrets for production...");
console.log("");

const jwtSecret = generateSecret();
const refreshSecret = generateSecret();

console.log("JWT_SECRET:", jwtSecret);
console.log("REFRESH_TOKEN_SECRET:", refreshSecret);
console.log("");
console.log("Copy these secrets and use them in the setup-production-secrets.mjs script.");
console.log("Or run the following commands manually:");
console.log("");
console.log(`npx wrangler secret put JWT_SECRET --env production`);
console.log(`npx wrangler secret put REFRESH_TOKEN_SECRET --env production`);
