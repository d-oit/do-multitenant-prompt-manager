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

console.log("🔄 Applying production database migrations...");

try {
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
  console.log("✅ Production migrations applied successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
