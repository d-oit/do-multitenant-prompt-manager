#!/usr/bin/env node

import { chromium } from "@playwright/test";

async function captureConsoleOutput() {
  console.log("🚀 Starting browser to capture console output...\n");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Arrays to store console messages
  const errors = [];
  const warnings = [];
  const logs = [];
  const networkErrors = [];

  // Capture console messages
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    const logEntry = {
      type,
      text,
      location: `${location.url}:${location.lineNumber}:${location.columnNumber}`
    };

    if (type === "error") {
      errors.push(logEntry);
      console.log(`❌ ERROR: ${text}`);
      console.log(`   Location: ${logEntry.location}\n`);
    } else if (type === "warning") {
      warnings.push(logEntry);
      console.log(`⚠️  WARNING: ${text}`);
      console.log(`   Location: ${logEntry.location}\n`);
    } else if (type === "log" || type === "info") {
      logs.push(logEntry);
      console.log(`ℹ️  LOG: ${text}\n`);
    }
  });

  // Capture page errors
  page.on("pageerror", (error) => {
    errors.push({
      type: "pageerror",
      text: error.message,
      stack: error.stack
    });
    console.log(`💥 PAGE ERROR: ${error.message}`);
    console.log(`   Stack: ${error.stack}\n`);
  });

  // Capture network errors
  page.on("response", (response) => {
    if (!response.ok()) {
      const error = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      };
      networkErrors.push(error);
      console.log(`🌐 NETWORK ERROR: ${response.status()} ${response.statusText()}`);
      console.log(`   URL: ${response.url()}\n`);
    }
  });

  // Capture request failures
  page.on("requestfailed", (request) => {
    const error = {
      url: request.url(),
      failure: request.failure()?.errorText || "Unknown error"
    };
    networkErrors.push(error);
    console.log(`🚫 REQUEST FAILED: ${error.failure}`);
    console.log(`   URL: ${request.url()}\n`);
  });

  try {
    console.log("📡 Navigating to http://localhost:5173...\n");
    await page.goto("http://localhost:5173", {
      waitUntil: "networkidle",
      timeout: 30000
    });

    console.log("✅ Page loaded, waiting 3 seconds to capture all console output...\n");
    await page.waitForTimeout(3000);

    // Check if app mounted successfully
    const appElement = await page.locator("#app").count();
    console.log(`📦 #app element found: ${appElement > 0 ? "YES" : "NO"}\n`);

    if (appElement > 0) {
      const innerHTML = await page.locator("#app").innerHTML();
      console.log(`📦 #app has children: ${innerHTML.length > 0 ? "YES" : "NO"}\n`);
    }

    // Print summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 SUMMARY");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Warnings: ${warnings.length}`);
    console.log(`Total Logs: ${logs.length}`);
    console.log(`Total Network Errors: ${networkErrors.length}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    if (errors.length > 0) {
      console.log("❌ ERRORS DETAIL:");
      errors.forEach((error, i) => {
        console.log(`\n${i + 1}. ${error.text}`);
        if (error.location) console.log(`   Location: ${error.location}`);
        if (error.stack) console.log(`   Stack: ${error.stack}`);
      });
      console.log("");
    }

    if (warnings.length > 0) {
      console.log("⚠️  WARNINGS DETAIL:");
      warnings.forEach((warning, i) => {
        console.log(`\n${i + 1}. ${warning.text}`);
        if (warning.location) console.log(`   Location: ${warning.location}`);
      });
      console.log("");
    }

    if (networkErrors.length > 0) {
      console.log("🌐 NETWORK ERRORS DETAIL:");
      networkErrors.forEach((error, i) => {
        console.log(
          `\n${i + 1}. ${error.status || "FAILED"} - ${error.statusText || error.failure}`
        );
        console.log(`   URL: ${error.url}`);
      });
      console.log("");
    }

    // Keep browser open for inspection
    console.log("🔍 Browser kept open for inspection. Press Ctrl+C to close.\n");
    await page.waitForTimeout(60000);
  } catch (error) {
    console.error("❌ Script error:", error);
  } finally {
    await browser.close();
    console.log("✅ Browser closed.");
  }
}

captureConsoleOutput().catch(console.error);
