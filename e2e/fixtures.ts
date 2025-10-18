import { test as base } from "@playwright/test";
import { generateTestId, waitForApi } from "./setup/dbHelpers";

type Fixtures = {
  testId: string;
};

export const test = base.extend<Fixtures>({
  testId: async ({ page }, use) => {
    // Stub recharts to avoid loading issues
    await page.route("**/node_modules/.vite/deps/recharts.js*", async (route) => {
      const stub = `const passthrough = () => ({ children }) => children ?? null;
export const ResponsiveContainer = passthrough();
export const LineChart = passthrough();
export const Line = passthrough();
export const CartesianGrid = passthrough();
export const XAxis = passthrough();
export const YAxis = passthrough();
export const Tooltip = passthrough();
export const BarChart = passthrough();
export const Bar = passthrough();
export const AreaChart = passthrough();
export const Area = passthrough();
export default {};
`;
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: stub
      });
    });

    // Wait for API to be ready before each test
    try {
      await waitForApi();
    } catch (error) {
      console.error("Failed to connect to API:", error);
      throw error;
    }

    // Generate unique test ID for this test
    const testId = generateTestId();

    await use(testId);

    // Cleanup can be added here if needed
  }
});

export const expect = test.expect;
