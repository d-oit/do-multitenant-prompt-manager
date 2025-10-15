import { test as base } from "@playwright/test";
import { setupApiMocks, type ApiState } from "./utils/mockApi";

type Fixtures = {
  apiState: ApiState;
};

export const test = base.extend<Fixtures>({
  apiState: async ({ page }, use) => {
    const state = await setupApiMocks(page);
    await use(state);
  }
});

export const expect = test.expect;
