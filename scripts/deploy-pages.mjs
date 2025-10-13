import { spawn } from "node:child_process";
import { platform } from "node:os";

const project = process.env.CF_PAGES_PROJECT;
if (!project) {
  console.error("CF_PAGES_PROJECT environment variable is required to deploy to Cloudflare Pages.");
  process.exit(1);
}

const branch = process.env.CF_PAGES_BRANCH || "production";

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

await run("npm", ["run", "build", "--workspace", "frontend"]);

await run(
  "npm",
  [
    "exec",
    "--workspace",
    "prompt-manager-worker",
    "--",
    "wrangler",
    "pages",
    "deploy",
    "frontend/dist",
    "--project-name",
    project,
    "--branch",
    branch
  ],
  {
    env: process.env
  }
);
