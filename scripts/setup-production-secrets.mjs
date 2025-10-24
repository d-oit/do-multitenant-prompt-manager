import { spawn } from "node:child_process";
import { platform } from "node:os";
import { createInterface } from "node:readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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

console.log("🔐 Setting up production secrets...");

// Get JWT secret from user
const jwtSecret = await question("Enter JWT secret (32-byte hex): ");
await run("npx", ["wrangler", "secret", "put", "JWT_SECRET", "--env", "production"], {
  env: { ...process.env, WRANGLER_SECRET_VALUE: jwtSecret }
});

// Get refresh token secret from user
const refreshSecret = await question("Enter refresh token secret (32-byte hex): ");
await run("npx", ["wrangler", "secret", "put", "REFRESH_TOKEN_SECRET", "--env", "production"], {
  env: { ...process.env, WRANGLER_SECRET_VALUE: refreshSecret }
});

rl.close();
console.log("✅ Production secrets configured successfully!");
