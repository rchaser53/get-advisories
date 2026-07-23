const test = require('node:test');
const assert = require('node:assert/strict');
const { getAdvisoryUrls } = require('../src/advisories');

function response(body, link = null) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    headers: { get: (name) => name === 'link' ? link : null },
  };
}

test('公開から24時間以内のURLだけを返す', async () => {
  const requested = [];
  const urls = await getAdvisoryUrls(
    { libraries: [{ ecosystem: 'npm', name: 'express' }] },
    {
      now: '2026-07-22T12:00:00.000Z',
      fetchImpl: async (url) => {
        requested.push(new URL(url));
        return response([
          { html_url: 'https://github.com/advisories/GHSA-new', published_at: '2026-07-21T12:00:00.000Z', withdrawn_at: null },
          { html_url: 'https://github.com/advisories/GHSA-old', published_at: '2026-07-21T11:59:59.999Z', withdrawn_at: null },
          { html_url: 'https://github.com/advisories/GHSA-future', published_at: '2026-07-22T12:00:00.001Z', withdrawn_at: null },
          { html_url: 'https://github.com/advisories/GHSA-withdrawn', published_at: '2026-07-22T11:00:00.000Z', withdrawn_at: '2026-07-22T11:30:00.000Z' },
        ]);
      },
    },
  );

  assert.deepEqual(urls, ['https://github.com/advisories/GHSA-new']);
  assert.equal(requested[0].searchParams.get('affects'), 'express');
  assert.equal(requested[0].searchParams.get('ecosystem'), 'npm');
  assert.equal(requested[0].searchParams.get('published'), '>=2026-07-21T12:00:00Z');
});

test('GitHub検索用日時からミリ秒を除去する', async () => {
  let published;
  await getAdvisoryUrls(
    { libraries: [{ ecosystem: 'npm', name: 'express' }] },
    {
      now: '2026-07-22T11:37:52.157Z',
      fetchImpl: async (url) => {
        published = new URL(url).searchParams.get('published');
        return response([]);
      },
    },
  );
  assert.equal(published, '>=2026-07-21T11:37:52Z');
});

test('複数ライブラリ間の同じURLを重複させない', async () => {
  const advisory = { html_url: 'https://github.com/advisories/GHSA-shared', published_at: '2026-07-22T10:00:00.000Z', withdrawn_at: null };
  const urls = await getAdvisoryUrls(
    { libraries: [{ ecosystem: 'npm', name: 'a' }, { ecosystem: 'npm', name: 'b' }] },
    { now: '2026-07-22T12:00:00.000Z', fetchImpl: async () => response([advisory]) },
  );
  assert.deepEqual(urls, [advisory.html_url]);
});

test('空の設定を拒否する', async () => {
  await assert.rejects(() => getAdvisoryUrls({ libraries: [] }), /libraries/);
});
