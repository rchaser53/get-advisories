#!/usr/bin/env node

const path = require('node:path');
const { appendFileSync } = require('node:fs');
const { readFile } = require('node:fs/promises');
const { getAdvisoryUrls } = require('./src/advisories');

const logPath = path.resolve(process.env.LOG_FILE || 'get-advisories.log');

function writeLog(message, method = 'log') {
  console[method](message);
  try {
    appendFileSync(logPath, `${message}\n`, 'utf8');
  } catch (error) {
    console.error(`get-advisories: ログファイルに書き込めませんでした: ${error.message}`);
  }
}

async function main() {
  const configPath = path.resolve(process.argv[2] || 'advisories.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const urls = await getAdvisoryUrls(config, {
    token: process.env.GITHUB_TOKEN,
  });

  if (urls.length === 0) {
    writeLog('該当する Advisory はありません。');
    return;
  }

  for (const url of urls) {
    writeLog(url);
  }
}

main().catch((error) => {
  writeLog(`get-advisories: ${error.message}`, 'error');
  process.exitCode = 1;
});
