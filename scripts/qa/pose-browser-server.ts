/** Local-only QA harness; never imported by the application or production server. */
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { createAuth, makeAccount, saveAccounts } from '../../server/auth';
import { createPoseResultsRouter } from '../../server/poseResults';
import { PRIVATE_DEV_FILE_PATTERNS } from '../../server/devFilePolicy';
import { finalDrillSubmission } from '../tests/fixtures/pose/result';

const root = process.cwd(), scratch = path.resolve(root, 'scratch');
await mkdir(scratch, { recursive: true });
const directory = await mkdtemp(path.join(scratch, 'pose-workflow-qa-'));
const auth = createAuth(directory), app = express();
const password = 'PoseLocalQaOnly_2026!'; // disposable fake accounts, no user credentials
await saveAccounts(directory, (['admin', 'teacher', 'student'] as const).map(role => makeAccount(`qapose_${role}`, `QA ${role}`, role, password)));
app.use(express.json({ limit: '1mb' }));
app.use('/api/survey', auth.router);
let mode = { delayMs: 0, fail: false };
const requests: { id: string; studentName: string; className: string; receivedAt: number; finishedAt?: number; status?: number }[] = [];
const evidence: unknown[] = [];
app.post('/api/pose-results', async (req, res, next) => {
  const scenario = { ...mode };
  const entry = { id: req.body?.id, studentName: req.body?.studentName, className: req.body?.className, receivedAt: Date.now() };
  requests.push(entry);
  res.once('finish', () => Object.assign(entry, { finishedAt: Date.now(), status: res.statusCode }));
  if (scenario.delayMs) await new Promise(resolve => setTimeout(resolve, scenario.delayMs));
  if (scenario.fail) return res.status(503).json({ error: 'QA simulated save failure (not production)' });
  next();
});
app.use('/api/pose-results', createPoseResultsRouter(directory, auth));
app.post('/__qa/control', (req, res) => {
  mode = { delayMs: Math.max(0, Math.min(30_000, Number(req.body?.delayMs) || 0)), fail: req.body?.fail === true };
  res.json({ mode });
});
app.post('/__qa/evidence', (req, res) => { evidence.push(req.body); res.json({ ok: true }); });
app.get('/__qa/status', async (_req, res) => {
  const content = await readFile(path.join(directory, 'pose_results.jsonl'), 'utf8').catch(() => '');
  res.json({ mode, requests, evidence, results: content.trim() ? content.trim().split('\n').map(line => JSON.parse(line)) : [] });
});
app.post('/__qa/seed-formula-drill', async (req, res) => {
  const result = { ...finalDrillSubmission(), id: 'qa-formula-drill-001', studentName: '=1+1', className: '12C1' };
  const response = await fetch(`${base}/api/pose-results`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
  res.status(response.status).json(await response.json());
});
// Role fixtures authenticate through the actual login API without automating an authentication dialog.
app.get('/__qa/login/:role', async (req, res) => {
  if (!['teacher', 'student', 'admin'].includes(req.params.role)) return res.sendStatus(404);
  const response = await fetch(`${base}/api/survey/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: `qapose_${req.params.role}`, password }) });
  if (!response.ok) return res.sendStatus(response.status);
  const cookie = response.headers.get('set-cookie');
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.redirect('/');
});
app.get('/__qa', (_req, res) => res.type('html').send('<h1>LOCAL QA ONLY — synthetic camera, isolated temporary data</h1><a href="/">Student workflow</a><p><a href="/__qa/login/teacher">Test Teacher</a></p><p><a href="/__qa/login/admin">Test Admin</a></p><p><a href="/__qa/login/student">Test Student</a></p>'));
const vite = await createViteServer({
  root, cacheDir: path.join(directory, 'vite-cache'),
  server: { middlewareMode: true, hmr: false, watch: null, fs: { deny: PRIVATE_DEV_FILE_PATTERNS } },
  plugins: [{ name: 'pose-local-qa-only', enforce: 'pre', resolveId(source, importer) {
    if (importer?.replaceAll('\\', '/').endsWith('/hooks/usePoseSession.ts')) {
      if (source === '../runtime/poseRuntime') return path.join(root, 'scripts/qa/pose-browser-runtime.ts');
      if (source === './usePoseCamera') return path.join(root, 'scripts/qa/pose-browser-camera.ts');
    }
  } }],
});
app.use(vite.middlewares);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
console.log(JSON.stringify({ qaUrl: base, dataDirectory: directory, isolated: true, syntheticCamera: true }));
let cleaning = false;
async function cleanup() {
  if (cleaning) return; cleaning = true;
  server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await vite.close();
  if (path.dirname(path.resolve(directory)) !== scratch || !path.basename(directory).startsWith('pose-workflow-qa-')) throw new Error('Unsafe QA cleanup target');
  await rm(directory, { recursive: true, force: true });
  console.log('QA cleanup complete: temporary accounts/results removed.');
  process.exit(0);
}
process.once('SIGINT', () => { void cleanup(); });
process.once('SIGTERM', () => { void cleanup(); });
