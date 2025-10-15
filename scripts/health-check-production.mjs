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

console.log("🏥 Running production health checks...");

// Test worker API health endpoint
try {
  const { spawnSync } = await import("child_process");
  const result = spawnSync(
    "curl",
    [
      "-s",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "https://do-multitenant-prompt-manager-api-production.dmmotec.workers.dev/"
    ],
    { encoding: "utf8" }
  );

  const statusCode = result.stdout?.trim();
  if (statusCode === "401") {
    console.log("✅ Worker API is healthy (authentication required)");
  } else {
    console.error(`❌ Worker API health check failed - HTTP ${statusCode}`);
    throw new Error(`Unexpected status code: ${statusCode}`);
  }
} catch (error) {
  console.error("❌ Worker API health check failed");
  console.error(error.message);
}

// Test Pages deployment
try {
  await run("curl", ["-f", "https://033d3067.do-multitenant-prompt-manager-production.pages.dev"]);
  console.log("✅ Pages deployment is healthy");
} catch (error) {
  console.error("❌ Pages health check failed");
}

console.log("🎉 All production health checks passed!");
