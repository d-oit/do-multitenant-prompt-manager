/**
 * Global setup for e2e tests
 * Ensures a default tenant exists before running tests
 */

import { chromium } from "@playwright/test";

async function globalSetup() {
  const API_BASE_URL = "http://localhost:8787";

  // Wait for API to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("Checking if default tenant exists...");

  try {
    // Check if tenants exist
    const response = await page.request.get(`${API_BASE_URL}/tenants`);

    if (response.ok()) {
      const data = await response.json();
      const tenants = data.data || [];

      if (tenants.length === 0) {
        console.log("No tenants found. Creating default tenant...");

        // Create a default tenant
        const createResponse = await page.request.post(`${API_BASE_URL}/tenants`, {
          data: {
            name: "Default Tenant",
            slug: "default"
          }
        });

        if (createResponse.ok()) {
          const tenant = await createResponse.json();
          console.log(`Default tenant created: ${tenant.data.name} (${tenant.data.id})`);
        } else {
          console.warn("Failed to create default tenant:", createResponse.status());
        }
      } else {
        console.log(`Found ${tenants.length} existing tenant(s)`);
      }
    }
  } catch (error) {
    console.warn("Could not setup default tenant:", error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
