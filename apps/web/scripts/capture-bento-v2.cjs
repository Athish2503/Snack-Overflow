/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\hathi\\.gemini\\antigravity\\brain\\144ff8cb-a2fd-479f-a569-d68335db63c0';

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@snackoverflow.local');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Wait for initial animation & donut mount

  // 1440px desktop
  console.log('2. Capturing 1440px admin dashboard...');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_bento_v2_1440px.png'), fullPage: true });

  // 1024px tablet landscape
  console.log('3. Capturing 1024px admin dashboard...');
  await page.setViewportSize({ width: 1024, height: 1200 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_bento_v2_1024px.png'), fullPage: true });

  // 768px tablet portrait
  console.log('4. Capturing 768px admin dashboard...');
  await page.setViewportSize({ width: 768, height: 1400 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_bento_v2_768px.png'), fullPage: true });

  // 390px mobile
  console.log('5. Capturing 390px admin dashboard...');
  await page.setViewportSize({ width: 390, height: 1800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT_DIR, 'admin_bento_v2_390px.png'), fullPage: true });

  // Test +25 chip confirm tap
  console.log('6. Testing +25 confirm tap on 1440px...');
  await page.setViewportSize({ width: 1440, height: 1100 });
  const chip25 = await page.locator('button.quick-chip:has-text("+25")').first();
  if (await chip25.isVisible()) {
    await chip25.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_bento_v2_confirm_chip.png'), fullPage: false });
    console.log('Captured Confirm +25 chip state.');
  }

  // Test Restock Any Snack modal
  console.log('7. Testing Restock Any Snack modal...');
  const restockAnyBtn = page.locator('button:has-text("Restock any snack")');
  if (await restockAnyBtn.isVisible()) {
    await restockAnyBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, 'admin_bento_v2_restock_modal.png') });
    console.log('Captured Restock any snack modal.');
    // Close modal
    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(300);
  }

  // Member Dashboard Verification
  console.log('8. Logging out and testing Member dashboard...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'member@snackoverflow.local');
  await page.fill('input[type="password"]', 'member123');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  console.log('9. Capturing Member dashboard with shared hero...');
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.screenshot({ path: path.join(OUT_DIR, 'member_bento_v2.png'), fullPage: true });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
