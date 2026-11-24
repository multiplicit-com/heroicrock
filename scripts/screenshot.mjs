// Diagnostic: screenshots the live site (and the player iframe) from a GitHub runner.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
await mkdir("shots", { recursive: true });
const browser = await chromium.launch();
const urls = process.env.URLS ? process.env.URLS.split(" ") : ["http://heroicrock.com/", "https://heroicrock.com/"];
for (const [i, url] of urls.entries()) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (m) => console.log(`[${i}] console ${m.type()}: ${m.text()}`));
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch (e) {
    console.log(`[${i}] ${url} failed: ${e.message}`);
    continue;
  }
  await page.waitForTimeout(4000);
  console.log(`[${i}] ${url} iframe src: ${await page.getAttribute("#player", "src")}`);
  const frame = page.frames().find((f) => f.url().includes("/embed/"));
  if (frame) console.log(`[${i}] iframe text: ${(await frame.locator("body").innerText().catch(() => "")).slice(0, 300).replace(/\n/g, " | ")}`);
  await page.screenshot({ path: `shots/${i}.png`, fullPage: true });
}
await browser.close();
