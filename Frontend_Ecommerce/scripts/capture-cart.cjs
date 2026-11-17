const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) resolve();
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => req.destroy());
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error('Server did not respond in ' + timeoutMs + 'ms');
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.events = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
        if (msg.method) {
          const listeners = this.events.get(msg.method) || [];
          listeners.forEach((fn) => fn(msg.params));
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, fn) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(fn);
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
  }
}

function killProcessOnPort(port) {
  try {
    const out = execSync(`netstat -aon | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
    const lines = out.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        try {
          execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
        } catch {}
      }
    }
  } catch {}
}

async function run() {
  const outputDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Free ports
  killProcessOnPort(4173);
  killProcessOnPort(9222);

  console.log('Starting Vite preview server on port 4173...');
  const server = spawn('cmd.exe', ['/c', 'npx', 'vite', 'preview', '--port', '4173'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
  });

  let chrome = null;

  try {
    await waitForServer('http://localhost:4173');
    console.log('Preview server ready at http://localhost:4173');

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    console.log('Starting Chrome headless on port 9222...');
    chrome = spawn(chromePath, [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      'about:blank',
    ], { stdio: 'ignore' });

    await waitForServer('http://127.0.0.1:9222/json/version', 10000);
    console.log('Chrome CDP ready.');

    const versionData = await fetchJson('http://127.0.0.1:9222/json/version');
    const wsUrl = versionData.webSocketDebuggerUrl;

    const browserClient = new CDPClient(wsUrl);
    await browserClient.connect();

    const { targetId } = await browserClient.send('Target.createTarget', { url: 'about:blank' });
    const targets = await fetchJson('http://127.0.0.1:9222/json/list');
    const pageTarget = targets.find((t) => t.id === targetId) || targets[0];
    const pageClient = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageClient.connect();

    await pageClient.send('Page.enable');
    await pageClient.send('Network.enable');

    const targetUrl = 'http://localhost:4173/cart';

    const navigateAndWait = () => {
      return new Promise(async (resolve) => {
        let loaded = false;
        pageClient.on('Page.loadEventFired', () => {
          loaded = true;
        });
        await pageClient.send('Page.navigate', { url: targetUrl });
        const check = setInterval(async () => {
          if (loaded) {
            clearInterval(check);
            setTimeout(resolve, 2500);
          }
        }, 100);
      });
    };

    console.log(`Navigating to ${targetUrl} ...`);
    await navigateAndWait();

    // 1. Desktop 1440x900 viewport
    console.log('Capturing Desktop 1440x900 Viewport...');
    await pageClient.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 600));

    const shot1440 = await pageClient.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const file1440 = path.join(outputDir, 'cart-desktop-1440x900.png');
    fs.writeFileSync(file1440, Buffer.from(shot1440.data, 'base64'));
    console.log(`Saved ${file1440} (${fs.statSync(file1440).size} bytes)`);

    // 2. Desktop Full-Page (1440 width)
    console.log('Capturing Desktop Full-Page Cart (1440 width)...');
    await pageClient.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await new Promise((r) => setTimeout(r, 400));

    const fullShot = await pageClient.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    const fullFile = path.join(outputDir, 'cart-desktop-full.png');
    fs.writeFileSync(fullFile, Buffer.from(fullShot.data, 'base64'));
    console.log(`Saved ${fullFile} (${fs.statSync(fullFile).size} bytes)`);

    // 3. Tablet Viewport (768x1024)
    console.log('Capturing Tablet Cart (768px wide)...');
    await pageClient.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await pageClient.send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 600));

    const tabletShot = await pageClient.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    const tabletFile = path.join(outputDir, 'cart-tablet.png');
    fs.writeFileSync(tabletFile, Buffer.from(tabletShot.data, 'base64'));
    console.log(`Saved ${tabletFile} (${fs.statSync(tabletFile).size} bytes)`);

    // 4. Mobile Viewport (375x812)
    console.log('Capturing Mobile Cart (375px wide)...');
    await pageClient.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0);' });
    await pageClient.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await new Promise((r) => setTimeout(r, 600));

    const mobileShot = await pageClient.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const mobileFile = path.join(outputDir, 'cart-mobile.png');
    fs.writeFileSync(mobileFile, Buffer.from(mobileShot.data, 'base64'));
    console.log(`Saved ${mobileFile} (${fs.statSync(mobileFile).size} bytes)`);

    // 5. Cart Drawer (Slide-Over) Open View
    console.log('Capturing Slide-Over Cart Drawer on Desktop...');
    await pageClient.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 400));

    // Trigger open drawer via button
    await pageClient.send('Runtime.evaluate', {
      expression: `
        document.querySelector('#open-drawer-btn')?.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 800));

    const drawerShot = await pageClient.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const drawerFile = path.join(outputDir, 'cart-drawer-open.png');
    fs.writeFileSync(drawerFile, Buffer.from(drawerShot.data, 'base64'));
    console.log(`Saved ${drawerFile} (${fs.statSync(drawerFile).size} bytes)`);

    // Close drawer
    await pageClient.send('Runtime.evaluate', {
      expression: `
        document.querySelector('#close-drawer-btn')?.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 6. Empty Cart State View
    console.log('Capturing Empty Cart State View...');
    await pageClient.send('Runtime.evaluate', {
      expression: `
        document.querySelector('#toggle-empty-cart-btn')?.click();
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    const emptyShot = await pageClient.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const emptyFile = path.join(outputDir, 'cart-empty-state.png');
    fs.writeFileSync(emptyFile, Buffer.from(emptyShot.data, 'base64'));
    console.log(`Saved ${emptyFile} (${fs.statSync(emptyFile).size} bytes)`);

    pageClient.close();
    browserClient.close();
    console.log('All 6 Cart screenshots captured successfully.');
  } finally {
    killProcessOnPort(4173);
    killProcessOnPort(9222);
  }
}

run().catch((err) => {
  console.error('Cart screenshot capture failed:', err);
  killProcessOnPort(4173);
  killProcessOnPort(9222);
  process.exit(1);
});

