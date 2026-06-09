import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "tmp", "responsive-audit");

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

async function discoverPaths() {
  const paths = ["/", "/photo-gallery", "/safari-packages", "/trips"];
  try {
    const packagesRes = await fetch(`${baseUrl}/safari-packages`);
    const packagesHtml = await packagesRes.text();
    const packageMatch = packagesHtml.match(/href="(\/safari-packages\/[^"?#]+)"/);
    if (packageMatch?.[1]) paths.push(packageMatch[1]);

    const tripsHtml = packagesHtml.includes("/trips/")
      ? packagesHtml
      : await (await fetch(`${baseUrl}/trips`)).text();
    const tripMatch = tripsHtml.match(/href="(\/trips\/[^"?#]+)"/);
    if (tripMatch?.[1]) paths.push(tripMatch[1]);
  } catch {
    // fall back to static paths only
  }
  return [...new Set(paths)];
}

async function auditPage(page, route, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const url = `${baseUrl}${route}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  if (!response || !response.ok()) {
    return { route, viewport: viewport.name, ok: false, error: `HTTP ${response?.status() ?? "failed"}` };
  }

  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const selectors = [
      ".gallery-grid",
      ".gallery-lightbox",
      ".pkg-detail__summary",
      ".pkg-facts--linear",
      ".pkg-linked-tours__grid",
      ".faq-flash-list",
      ".acc-grid--trips",
      ".acc-card__footer",
    ];
    const clipped = selectors
      .map((selector) => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return rect.right > window.innerWidth + 1 ? selector : null;
      })
      .filter(Boolean);

    return {
      overflow,
      clipped,
      title: document.title,
    };
  });

  const safeRoute = route.replace(/\//g, "_").replace(/^_/, "") || "home";
  const screenshotPath = path.join(outDir, `${safeRoute}-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    route,
    viewport: viewport.name,
    ok: metrics.overflow <= 1 && metrics.clipped.length === 0,
    overflow: metrics.overflow,
    clipped: metrics.clipped,
    title: metrics.title,
    screenshot: screenshotPath,
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const routes = await discoverPaths();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...devices["Desktop Chrome"] });
  const page = await context.newPage();
  const results = [];

  for (const route of routes) {
    for (const viewport of viewports) {
      try {
        results.push(await auditPage(page, route, viewport));
      } catch (error) {
        results.push({
          route,
          viewport: viewport.name,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await browser.close();

  const reportPath = path.join(outDir, "report.json");
  await writeFile(reportPath, JSON.stringify({ baseUrl, routes, results }, null, 2));

  const failures = results.filter((entry) => !entry.ok);
  console.log(JSON.stringify({ reportPath, total: results.length, failures: failures.length }, null, 2));
  for (const failure of failures) {
    console.log(`FAIL ${failure.route} @ ${failure.viewport}:`, failure.error ?? {
      overflow: failure.overflow,
      clipped: failure.clipped,
    });
  }

  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
