const API_URL = 'https://api.github.com/advisories';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// GitHubの検索構文は秒までのISO 8601日時を受け付けるが、ミリ秒は受け付けない。
function toGitHubSearchDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function validateConfig(config) {
  if (!config || !Array.isArray(config.libraries) || config.libraries.length === 0) {
    throw new Error('設定には1件以上の libraries が必要です');
  }

  for (const [index, library] of config.libraries.entries()) {
    if (!library || typeof library.name !== 'string' || !library.name.trim()) {
      throw new Error(`libraries[${index}].name を指定してください`);
    }
    if (typeof library.ecosystem !== 'string' || !library.ecosystem.trim()) {
      throw new Error(`libraries[${index}].ecosystem を指定してください`);
    }
  }
}

function nextPage(linkHeader) {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

async function fetchForLibrary(library, since, options) {
  const request = options.fetchImpl || globalThis.fetch;
  if (typeof request !== 'function') {
    throw new Error('Node.js 18以上が必要です');
  }

  const params = new URLSearchParams({
    ecosystem: library.ecosystem.toLowerCase(),
    affects: library.name,
    published: `>=${toGitHubSearchDate(since)}`,
    sort: 'published',
    direction: 'desc',
    per_page: '100',
  });
  let url = `${API_URL}?${params}`;
  const advisories = [];

  while (url) {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'get-advisories',
    };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;

    const response = await request(url, { headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`GitHub API error ${response.status}: ${body.slice(0, 300)}`);
    }
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('GitHub APIから不正な応答を受信しました');
    advisories.push(...page);
    url = nextPage(response.headers.get('link'));
  }

  return advisories;
}

async function getAdvisoryUrls(config, options = {}) {
  validateConfig(config);
  const now = options.now ? new Date(options.now) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error('実行日時が不正です');
  const since = new Date(now.getTime() - ONE_DAY_MS);
  const urls = new Set();

  for (const library of config.libraries) {
    const advisories = await fetchForLibrary(library, since, options);
    for (const advisory of advisories) {
      const published = new Date(advisory.published_at);
      if (
        advisory.html_url &&
        !advisory.withdrawn_at &&
        !Number.isNaN(published.getTime()) &&
        published >= since &&
        published <= now
      ) {
        urls.add(advisory.html_url);
      }
    }
  }

  return [...urls];
}

module.exports = { getAdvisoryUrls, validateConfig };
