import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Bundle the real loaders in memory: only the Vite asset URL is substituted.
// No server, downloaded module, webcam, or generated test file is needed.
for (const feature of ['pose', 'physics'] as const) {
  test(`${feature}: actual loader survives fetch/HTTP/invalid-WASM failures and retries successfully`, async t => {
    const entry = feature === 'pose' ? '../../src/features/pose-analysis/runtime/loadSequenceEngine.ts' : '../../src/features/physics/usePhysicsEngine.ts';
    const binary = feature === 'pose' ? '../../src/features/pose-analysis/scoring/sequence.wasm' : '../../src/features/physics/projectile.wasm';
    const bundle = await build({
      entryPoints: [fileURLToPath(new URL(entry, import.meta.url))], bundle: true, write: false,
      platform: 'browser', format: 'esm', define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [{ name: 'fixture-asset-url', setup(builder) {
        builder.onResolve({ filter: /\.wasm\?url$/ }, args => ({ path: args.path, namespace: 'fixture-asset' }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture-asset' }, () => ({ contents: 'export default "/fixture.wasm";', loader: 'js' }));
      } }],
    });
    const module = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
    const load = feature === 'pose' ? module.loadSequenceEngine : module.loadPhysicsEngine;
    const warn = t.mock.method(console, 'warn', () => {});
    let responseMode = 'network';
    const bytes = new Uint8Array(readFileSync(new URL(binary, import.meta.url))).buffer;
    const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
      if (responseMode === 'network') throw new TypeError('Fixture network failure');
      if (responseMode === 'http') return new Response('', { status: 404 });
      if (responseMode === 'invalid') return new Response('not a wasm binary');
      return new Response(bytes);
    });
    for (const mode of ['network', 'http', 'invalid']) {
      responseMode = mode;
      const fallback = await load();
      assert.equal(fallback.kind, 'javascript', mode);
      if (feature === 'pose') assert.equal(fallback.distance([0, 0.5, 1], [0, 0.5, 1], 1), 0);
      else {
        const trajectory = fallback.sampleArcadeTrajectory([0, 1, 0], [2, 1, -50], 0.2, 0.1, 64);
        assert.equal(trajectory.sampleCount, 64);
        assert.ok(trajectory.samples.every(Number.isFinite));
      }
    }
    assert.equal(warn.mock.callCount(), 3);
    responseMode = 'success';
    const [first, second] = await Promise.all([load(), load()]);
    assert.equal(first.kind, 'wasm');
    assert.equal(first, second);
    assert.equal(fetchMock.mock.callCount(), 4, 'failures retry; parallel success shares one load');
    assert.equal(await load(), first);
    assert.equal(fetchMock.mock.callCount(), 4, 'successful engine is cached');
  });
}
