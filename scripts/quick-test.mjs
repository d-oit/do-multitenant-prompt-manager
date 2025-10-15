#!/usr/bin/env node

import { chromium } from "@playwright/test";

async function quickTest() {
  console.log("🎭 Quick console test...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];

  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") errors.push(text);
    else if (type === "warning") warnings.push(text);
  });

  page.on("pageerror", (error) => errors.push(error.message));

  try {
    await page.goto("http://localhost:5173", { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);

    const appHasContent = (await page.locator("#app").count()) > 0;

    console.log("📊 Results:");
    console.log(`  App Mounted: ${appHasContent ? "✅" : "❌"}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      console.log("❌ Errors:");
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log("✅ No errors!");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await browser.close();
  }
}

quickTest().catch(console.error);
