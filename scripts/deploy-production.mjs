import { spawn } from "node:child_process";
import { platform } from "node:os";

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: platform() === "win32",
      ...options
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

console.log("🚀 Starting production deployment...");

// Step 1: Build frontend for production
console.log("📦 Building frontend...");
await run("npm", ["run", "build:frontend"]);

// Step 2: Apply database migrations to production
console.log("🗃️ Applying production database migrations...");
await run("npx", [
  "wrangler",
  "d1",
  "migrations",
  "apply",
  "do_multitenant_prompt_manager_production",
  "--remote",
  "--env",
  "production"
]);

// Step 3: Deploy worker to production
console.log("⚙️ Deploying worker to production...");
await run("npx", ["wrangler", "deploy", "--env", "production"]);

// Step 4: Deploy frontend to Cloudflare Pages
console.log("🌐 Deploying frontend to Cloudflare Pages...");
await run("npx", [
  "wrangler",
  "pages",
  "deploy",
  "frontend/dist",
  "--project-name",
  "do-multitenant-prompt-manager-production"
]);

console.log("✅ Production deployment completed successfully!");
console.log("📊 Monitor your deployment in the Cloudflare Dashboard");
