#!/usr/bin/env node

const path = require('node:path');
const { readFile } = require('node:fs/promises');
const { getAdvisoryUrls } = require('./src/advisories');

async function main() {
  const configPath = path.resolve(process.argv[2] || 'advisories.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const urls = await getAdvisoryUrls(config, {
    token: process.env.GITHUB_TOKEN,
  });

  if (urls.length === 0) {
    console.log('該当する Advisory はありません。');
    return;
  }

  for (const url of urls) {
    console.log(url);
  }
}

main().catch((error) => {
  console.error(`get-advisories: ${error.message}`);
  process.exitCode = 1;
});
