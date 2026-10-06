import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'vite';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { PRIVATE_DEV_FILE_PATTERNS } from '../../server/devFilePolicy';

test('Vite development file routes deny anonymous access to Pose storage and temporary rewrites', async () => {
  // Vite's Windows /@fs middleware serves the process drive, so keep this fixture on that drive.
  const fixtureParent = process.cwd();
  const directory = await mkdtemp(path.join(fixtureParent, '.pose-privacy-test-'));
  let vite: Awaited<ReturnType<typeof createServer>> | undefined;
  let server: ReturnType<express.Express['listen']> | undefined;
  try {
    for (const file of ['pose_results.jsonl', 'pose_results.jsonl.tmp', 'accounts.json', 'exam_results.jsonl']) {
      await writeFile(path.join(directory, file), 'private learning data', 'utf8');
    }
    await writeFile(path.join(directory, 'public-note.txt'), 'public note', 'utf8');
    vite = await createServer({ configFile: false, root: directory, publicDir: false, logLevel: 'silent',
      server: { middlewareMode: true, hmr: false, watch: null, fs: { allow: [directory], deny: PRIVATE_DEV_FILE_PATTERNS } },
      optimizeDeps: { noDiscovery: true, include: [] } });
    const app = express();
    app.use(vite.middlewares);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const request = (file: string) => fetch(`${base}/@fs/${path.join(directory, file).replaceAll('\\', '/')}`);
    const ordinary = await request('public-note.txt');
    assert.equal(ordinary.status, 200);
    assert.equal(await ordinary.text(), 'public note');
    for (const file of ['pose_results.jsonl', 'pose_results.jsonl.tmp', 'accounts.json', 'exam_results.jsonl']) {
      const response = await request(file);
      assert.equal(response.status, 403, file);
      assert.ok(!(await response.text()).includes('private learning data'));
    }
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise<void>(resolve => server!.close(() => resolve()));
    }
    await vite?.close();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(fixtureParent));
    assert.ok(path.basename(directory).startsWith('.pose-privacy-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});
