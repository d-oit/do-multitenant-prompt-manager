import { test as base } from "@playwright/test";
import { setupApiMocks, type ApiState } from "./utils/mockApi";

type Fixtures = {
  apiState: ApiState;
};

export const test = base.extend<Fixtures>({
  apiState: async ({ page }, use) => {
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
    const state = await setupApiMocks(page);
    await use(state);
  }
});

export const expect = test.expect;
