import fs from 'fs';
import path from 'path';
import lighthouse from 'lighthouse';
import * as ChromeLauncher from 'chrome-launcher';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urlsFile = path.join(__dirname, 'urls.txt');
const outputDir = path.join(__dirname, 'report-output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const runLighthouse = async (url, index) => {
  const chrome = await ChromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { port: chrome.port, output: 'html', logLevel: 'info' };
  const runnerResult = await lighthouse(url, options);

  const reportHtml = runnerResult.report;
  const filename = `report-${index + 1}-${new URL(url).hostname}.html`;
  const reportPath = path.join(outputDir, filename);
  fs.writeFileSync(reportPath, reportHtml);

  console.log(`✅ Report saved for ${url}: ${reportPath}`);

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
