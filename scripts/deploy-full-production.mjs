#!/usr/bin/env node

import { spawn } from "node:child_process";
import { platform } from "node:os";
import { readFile } from "node:fs/promises";

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

async function runNpmScript(scriptName) {
  console.log(`📦 Running: npm run ${scriptName}`);
  await run("npm", ["run", scriptName]);
}

async function checkEnvironment() {
  console.log("🔍 Checking production environment...");

  try {
    const wranglerConfig = await readFile("wrangler.production.toml", "utf8");

    // Check if production configuration exists
    if (!wranglerConfig.includes("[env.production]")) {
      throw new Error("Production environment configuration not found");
    }

    // Check for D1 database binding
    if (!wranglerConfig.includes("[[env.production.d1_databases]]")) {
      throw new Error("D1 database configuration not found");
    }

    // Check for KV namespace binding
    if (!wranglerConfig.includes("[[env.production.kv_namespaces]]")) {
      throw new Error("KV namespace configuration not found");
    }

    console.log("✅ Production configuration verified");
  } catch (error) {
    console.error("❌ Production configuration check failed");
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  console.log("🚀 Starting full production deployment...\n");

  try {
    // Step 1: Check environment
    await checkEnvironment();

    // Step 2: Setup production secrets (if needed)
    console.log("\n🔐 Step 1: Setting up production secrets...");
    await runNpmScript("setup:production-secrets");

    // Step 3: Apply database migrations
    console.log("\n🗄️ Step 2: Applying database migrations...");
    await runNpmScript("migrate:production");

    // Step 4: Build frontend
    console.log("\n🏗️ Step 3: Building frontend for production...");
    await runNpmScript("build:frontend");

    // Step 5: Deploy to production
    console.log("\n🚀 Step 4: Deploying to production...");
    await runNpmScript("deploy:production");

    // Step 6: Health check
    console.log("\n🏥 Step 5: Running health checks...");
    await runNpmScript("health-check:production");

    console.log("\n🎉 Full production deployment completed successfully!");
    console.log("\n📊 Production URLs:");
    console.log("   Frontend: https://033d3067.do-multitenant-prompt-manager-production.pages.dev");
    console.log("   API: https://do-multitenant-prompt-manager-api-production.dmmotec.workers.dev");
    console.log("\n💡 Next steps:");
    console.log("   - Test the application functionality");
    console.log("   - Configure custom domain (if needed)");
    console.log("   - Set up monitoring and alerts");
  } catch (error) {
    console.error("\n❌ Production deployment failed:");
    console.error(error.message);
    process.exit(1);
  }
}

main().catch(console.error);
