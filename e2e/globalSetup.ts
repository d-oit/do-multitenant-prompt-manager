/**
 * Global setup for e2e tests
 * Waits for services to be ready before running tests
 */

async function globalSetup() {
  const API_BASE_URL = "http://localhost:8787";
  const FRONTEND_URL = "http://localhost:5173";
  const MAX_RETRIES = 60;
  const RETRY_DELAY = 1000;

  console.log("🔧 Starting E2E test environment setup...");

  // Wait for API to be ready
  console.log("⏳ Waiting for API to be ready...");
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/healthz`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API is ready: ${JSON.stringify(data)}`);
        break;
      }
    } catch {
      if (i === MAX_RETRIES - 1) {
        throw new Error(`❌ API did not become ready after ${MAX_RETRIES} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  // Wait for frontend to be ready
  console.log("⏳ Waiting for frontend to be ready...");
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(FRONTEND_URL);
      if (response.ok) {
        console.log("✅ Frontend is ready");
        break;
      }
    } catch {
      if (i === MAX_RETRIES - 1) {
        throw new Error(`❌ Frontend did not become ready after ${MAX_RETRIES} attempts`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  // Verify we can access the API (should work with E2E_TEST_MODE)
  console.log("🔍 Verifying API access...");
  try {
    const response = await fetch(`${API_BASE_URL}/tenants`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.data?.length || 0} tenant(s)`);
    } else {
      console.warn(`⚠️  API returned status ${response.status} for /tenants`);
    }
  } catch (error) {
    console.warn("⚠️  Could not verify API access:", error);
  }

  console.log("✅ E2E test environment is ready!");
}

export default globalSetup;
