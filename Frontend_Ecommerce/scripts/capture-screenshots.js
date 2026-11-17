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

async function run() {
  const outputDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log('[Vite]:', d.toString().trim()));
  server.stderr.on('data', (d) => console.error('[Vite err]:', d.toString().trim()));

  try {
    await waitForServer('http://localhost:4173');
    console.log('Preview server ready at http://localhost:4173');

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    
    // Viewports to test
    const viewports = [
      { name: 'homepage-desktop', width: 1280, height: 4000 },
      { name: 'homepage-tablet', width: 768, height: 3000 },
      { name: 'homepage-mobile', width: 375, height: 2500 }
    ];

    for (const vp of viewports) {
      const outFile = path.join(outputDir, `${vp.name}.png`);
      console.log(`Capturing ${vp.name} (${vp.width}x${vp.height})...`);
      
      const cmd = `"${chromePath}" --headless=new --screenshot="${outFile}" --window-size=${vp.width},${vp.height} --hide-scrollbars --virtual-time-budget=5000 http://localhost:4173/`;
      execSync(cmd, { stdio: 'inherit' });
      
      const stats = fs.statSync(outFile);
      console.log(`Saved ${outFile} (${stats.size} bytes)`);
    }

    console.log('All screenshots captured successfully.');
  } finally {
    server.kill();
    // On Windows, also kill child processes if any
    try {
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq npm*"', { stdio: 'ignore' });
    } catch {}
  }
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});

