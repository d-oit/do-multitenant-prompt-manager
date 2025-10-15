import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Disable parallel execution to avoid database conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use single worker to avoid database conflicts
  globalSetup: "./e2e/globalSetup.ts",
  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 30000,
    actionTimeout: 15000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command:
        "wrangler dev --local --persist-to=.wrangler/state --port 8787 --var E2E_TEST_MODE:true",
      url: "http://localhost:8787/tenants",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000
    },
    {
      command: "npm run dev:frontend",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        VITE_API_BASE_URL: "http://localhost:8787"
      }
    }
  ]
});
