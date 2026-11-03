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
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext();

    // 1. Triangle Lab - Flat World (1440x900)
    console.log('Capturing Triangle Lab (Flat World)...');
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'triangle-flat-desktop.png') });

    // 2. Triangle Lab - Details Open
    console.log('Capturing Details Drawer...');
    const detailsBtn = page.getByRole('button', { name: /details/i });
    if (await detailsBtn.count() > 0) {
      await detailsBtn.first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outDir, 'triangle-details-desktop.png') });
      const closeBtn = page.getByRole('button', { name: /close details panel/i });
      if (await closeBtn.count() > 0) {
        await closeBtn.first().click();
        await page.waitForTimeout(400);
      }
    }

    // 3. Triangle Lab - Sphere World
    console.log('Capturing Triangle Lab (Sphere World)...');
    const sphereBtn = page.getByRole('button', { name: /^sphere/i });
    if (await sphereBtn.count() > 0) {
      await sphereBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, 'triangle-sphere-desktop.png') });
    }

    // 4. Triangle Lab - Hyperbolic Saddle World
    console.log('Capturing Triangle Lab (Saddle World)...');
    const hypBtn = page.getByRole('button', { name: /^hyperbolic/i });
    if (await hypBtn.count() > 0) {
      await hypBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, 'triangle-saddle-desktop.png') });
    }

    // 5. Mobile Viewport (390x844) - Flat Triangle
    console.log('Capturing Mobile Triangle View...');
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    await mobilePage.goto('http://127.0.0.1:4173', { waitUntil: 'load' });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(outDir, 'triangle-flat-mobile.png') });

    console.log('Phase 3a screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

run();
