import { spawn } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { platform } from "node:os";
import { randomBytes } from "node:crypto";

/* eslint-disable no-console, no-process-exit */

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
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function generateSecret() {
  return randomBytes(32).toString("hex");
}

async function setup() {
  console.log("🚀 Setting up do-multitenant-prompt-manager...\n");

  try {
    // Step 1: Check if .env already exists
    if (existsSync(".env")) {
      console.log("⚠️  .env file already exists. Skipping environment setup.");
      console.log("   If you want to regenerate secrets, delete .env and run this script again.\n");
    } else {
      console.log("📝 Creating .env file from .env.example...");

      // Check if .env.example exists
      if (!existsSync(".env.example")) {
        console.error(
          "❌ .env.example file not found in project root. Please ensure you're running this from the project root or the file exists."
        );
        process.exit(1);
      }

      // Copy .env.example to .env from project root
      copyFileSync(".env.example", ".env");

      // Generate secure secrets
      const jwtSecret = await generateSecret();
      const refreshTokenSecret = await generateSecret();

      // Read .env content and replace secrets
      let envContent = readFileSync(".env", "utf8");
      envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET="${jwtSecret}"`);
      envContent = envContent.replace(
        /REFRESH_TOKEN_SECRET=.*/,
        `REFRESH_TOKEN_SECRET="${refreshTokenSecret}"`
      );

      writeFileSync(".env", envContent);
      console.log("✅ Generated secure JWT secrets");
    }

    // Step 2: Create D1 Database
    console.log("\n🗄️  Creating D1 database...");
    try {
      await run("wrangler", ["d1", "create", "do_multitenant_prompt_manager"]);
      console.log("✅ D1 database created");
    } catch (error) {
      console.log("⚠️  D1 database may already exist, skipping...");
    }

    // Step 3: Create KV Namespace
    console.log("\n🗂️  Creating KV namespace...");
    try {
      await run("wrangler", ["kv", "namespace", "create", "PROMPT_CACHE"]);
      console.log("✅ KV namespace created");
    } catch (error) {
      console.log("⚠️  KV namespace may already exist, skipping...");
    }

    // Step 4: Update wrangler.toml
    console.log("\n⚙️  Updating wrangler.toml with database and namespace IDs...");
    // This would require parsing the wrangler output to extract IDs
    // For now, we'll inform the user to update manually
    console.log(
      "⚠️  Please manually update wrangler.toml with the database and namespace IDs shown above"
    );

    console.log("\n🎉 Setup complete!");
    console.log("\nNext steps:");
    console.log("1. Update wrangler.toml with the database and namespace IDs");
    console.log(
      "2. Run 'npm run migrate --workspace do-multitenant-prompt-manager-worker' to apply migrations"
    );
    console.log(
      "3. Run 'wrangler secret put JWT_SECRET' and 'wrangler secret put REFRESH_TOKEN_SECRET' with the values from .env"
    );
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

setup().catch(console.error);
