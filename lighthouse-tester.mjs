import fs from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import * as ChromeLauncher from 'chrome-launcher';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urlsFile = path.join(__dirname, 'urls.txt');
const outputDir = path.join(__dirname, 'results');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const runLighthouse = async (url, index) => {
  const chrome = await ChromeLauncher.launch({ chromeFlags: ['--headless'] });
  const port = chrome.port;

  const runs = [
    {
      label: 'sm',
      config: {
        extends: 'lighthouse:default',
        settings: {
          emulatedFormFactor: 'mobile',
          formFactor: 'mobile',
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            disabled: false,
          },
        },
      },
    },
    {
      label: 'lg',
      config: {
        extends: 'lighthouse:default',
        settings: {
          emulatedFormFactor: 'desktop',
          formFactor: 'desktop',
          screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
          },
        },
      },
    },
  ];

  // Create timestamp for filenames
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '')   // replace characters not allowed in filenames
    .replace('T', '-')       // separate date and time
    .slice(0, 19);           // remove milliseconds and Z

  for (const run of runs) {
    const result = await lighthouse(url, { port,
      output: 'html',
      logLevel: 'info',
    }, run.config);

    const reportHtml = result.report;
    const hostname = new URL(url).hostname.replace('www.', '');
    const filename = `lh-${index + 1}-${hostname}-${run.label}-${timestamp}.html`;
    const reportPath = path.join(outputDir, filename);
    fs.writeFileSync(reportPath, reportHtml);
    console.log(`✅ ${run.label} report saved for ${url}: ${reportPath}`);
  }

  await ChromeLauncher.killAll();
};

const runAll = async () => {
  const urls = fs.readFileSync(urlsFile, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (let i = 0; i < urls.length; i++) {
    try {
      await runLighthouse(urls[i], i);
    } catch (err) {
      console.error(`❌ Failed on ${urls[i]}:`, err.message);
    }
  }
};

runAll();
