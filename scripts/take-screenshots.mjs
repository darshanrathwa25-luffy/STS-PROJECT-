import { chromium } from 'playwright';
import http from 'http';
import path from 'path';
import fs from 'fs';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'docs', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Simple static file server for dist
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
      let filePath = path.join(distDir, reqPath);

      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading file');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`Static server running at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startServer(4173);

  let browser;
  try {
    console.log('Launching browser via Playwright...');
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
      console.log('Could not launch msedge channel, falling back to default chromium:', e.message);
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext();

    // 1. Desktop Shell View (1440x900)
    console.log('Capturing Desktop Shell...');
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'shell-desktop-flat.png') });

    // 2. Details Open
    console.log('Capturing Details Drawer...');
    const detailsBtn = page.getByRole('button', { name: /details/i });
    if (await detailsBtn.count() > 0) {
      await detailsBtn.first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outDir, 'shell-desktop-details.png') });
    }

    // 3. Switch to Hyperbolic World
    console.log('Capturing Hyperbolic World...');
    const hypBtn = page.getByRole('button', { name: /hyperbolic/i });
    if (await hypBtn.count() > 0) {
      await hypBtn.first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outDir, 'shell-desktop-hyperbolic.png') });
    }

    // 4. Return to Landing Screen
    console.log('Capturing Landing Screen...');
    const brandBtn = page.getByRole('button', { name: /curvature lab/i });
    if (await brandBtn.count() > 0) {
      await brandBtn.first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outDir, 'landing-desktop.png') });
    }

    // 5. Mobile Viewport (390x844)
    console.log('Capturing Mobile Shell...');
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    await mobilePage.goto('http://127.0.0.1:4173', { waitUntil: 'load' });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(outDir, 'shell-mobile.png') });

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run();
