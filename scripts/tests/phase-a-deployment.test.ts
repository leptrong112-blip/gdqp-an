import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const getWorkerHandler = async () => {
  const dynamicImport = new Function('specifier', 'return import(specifier)');
  const mod = await dynamicImport('../../cloudflare/worker.ts');
  return mod.default;
};

test('A1: Cloudflare Worker API routing isolates unhandled endpoints with JSON errors and preserves assets/survey', async () => {
  const workerHandler = await getWorkerHandler();
  let assetsCalled = false;
  const mockEnv: any = {
    ASSETS: {
      fetch: async (req: Request) => {
        assetsCalled = true;
        return new Response('<html>SPA index</html>', { status: 200, headers: { 'Content-Type': 'text/html' } });
      },
    },
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          all: async () => ({ results: [] }),
          run: async () => ({ success: true }),
        }),
      }),
    },
  };

  // 1. /api/ask returns 501 with JSON (NOT index.html)
  const askRes = await workerHandler.fetch(new Request('https://test.gdqp.vn/api/ask', { method: 'POST' }), mockEnv);
  assert.equal(askRes.status, 501);
  assert.equal(askRes.headers.get('content-type'), 'application/json; charset=utf-8');
  const askBody = await askRes.json() as { error: string; code: string };
  assert.equal(askBody.code, 'AI_NOT_CONFIGURED');
  assert.match(askBody.error, /Trợ giảng AI/);

  // 2. /api/exam/results returns 501 with JSON
  const examRes = await workerHandler.fetch(new Request('https://test.gdqp.vn/api/exam/results'), mockEnv);
  assert.equal(examRes.status, 501);
  const examBody = await examRes.json() as { error: string; code: string };
  assert.equal(examBody.code, 'EXAM_BACKEND_UNAVAILABLE');
  assert.match(examBody.error, /Hệ thống thi/);

  // 3. /api/evaluate-essay returns 501 with JSON
  const essayRes = await workerHandler.fetch(new Request('https://test.gdqp.vn/api/evaluate-essay', { method: 'POST' }), mockEnv);
  assert.equal(essayRes.status, 501);
  const essayBody = await essayRes.json() as { error: string; code: string };
  assert.equal(essayBody.code, 'EXAM_BACKEND_UNAVAILABLE');

  // 4. /api/unknown-service returns 404 with JSON
  const unknownRes = await workerHandler.fetch(new Request('https://test.gdqp.vn/api/unknown-service'), mockEnv);
  assert.equal(unknownRes.status, 404);
  const unknownBody = await unknownRes.json() as { error: string; code: string };
  assert.equal(unknownBody.code, 'NOT_FOUND');

  // 5. Non-API routes fall through to env.ASSETS
  assetsCalled = false;
  const staticRes = await workerHandler.fetch(new Request('https://test.gdqp.vn/'), mockEnv);
  assert.equal(assetsCalled, true);
  assert.equal(staticRes.status, 200);

  assetsCalled = false;
  const assetSubpathRes = await workerHandler.fetch(new Request('https://test.gdqp.vn/assets/app.js'), mockEnv);
  assert.equal(assetsCalled, true);
  assert.equal(assetSubpathRes.status, 200);
});

test('A2: Build separation - dist contains only static assets; dist-server contains server bundle', () => {
  const root = process.cwd();
  const distDir = path.join(root, 'dist');
  const distServerDir = path.join(root, 'dist-server');

  // 1. Check server bundle is NOT in static dist
  assert.equal(existsSync(path.join(distDir, 'server.cjs')), false, 'dist/server.cjs must not exist');
  assert.equal(existsSync(path.join(distDir, 'server.cjs.map')), false, 'dist/server.cjs.map must not exist');

  // 2. Check server bundle is in dist-server
  assert.equal(existsSync(path.join(distServerDir, 'server.cjs')), true, 'dist-server/server.cjs must exist');
  assert.equal(existsSync(path.join(distServerDir, 'server.cjs.map')), true, 'dist-server/server.cjs.map must exist');

  // 3. Check client assets exist in dist
  assert.equal(existsSync(path.join(distDir, 'index.html')), true, 'dist/index.html must exist');
});

test('A2: Node server starts successfully from dist-server/server.cjs and responds to HTTP', async () => {
  const root = process.cwd();
  const serverPath = path.join(root, 'dist-server', 'server.cjs');
  assert.equal(existsSync(serverPath), true, 'dist-server/server.cjs must exist to start');

  const testPort = 38921;
  const child = spawn(process.execPath, [serverPath], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(testPort),
      NODE_ENV: 'production',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverStarted = false;
  const output: string[] = [];

  child.stdout.on('data', (d) => {
    const text = d.toString();
    output.push(text);
    if (text.includes(`Server running on port ${testPort}`)) {
      serverStarted = true;
    }
  });

  child.stderr.on('data', (d) => {
    output.push(d.toString());
  });

  try {
    // Wait for server to start (up to 8s)
    const start = Date.now();
    while (!serverStarted && Date.now() - start < 8000) {
      await new Promise((r) => setTimeout(r, 200));
    }
    assert.equal(serverStarted, true, `Server failed to start in time. Output: ${output.join('')}`);

    // Verify it serves HTTP request
    const res = await fetch(`http://127.0.0.1:${testPort}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /<!doctype html>/i);

    // Verify survey config responds
    const surveyConfigRes = await fetch(`http://127.0.0.1:${testPort}/api/survey/config`);
    assert.equal(surveyConfigRes.status, 200);

  } finally {
    child.kill('SIGTERM');
    // Allow process to exit
    await new Promise((r) => setTimeout(r, 300));
  }
});
