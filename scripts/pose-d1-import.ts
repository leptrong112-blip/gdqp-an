import { createHash } from 'node:crypto';
import { readFile, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePoseResultSubmission, type PoseResultSubmission } from '../src/features/pose-analysis/results/poseResultTypes';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export interface ImportRecord { result: PoseResultSubmission; createdAt: string; hash: string }
export function readImportRecords(content: string): ImportRecord[] {
  const records = new Map<string, ImportRecord>();
  for (const [index, line] of content.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    let raw: any;
    try { raw = JSON.parse(line); } catch { throw new Error(`Invalid JSON at line ${index + 1}.`); }
    const result = parsePoseResultSubmission(raw);
    if (!result || typeof raw.createdAt !== 'string' || !Number.isFinite(Date.parse(raw.createdAt))) {
      throw new Error(`Invalid result at line ${index + 1}; no records imported.`);
    }
    // The same whitelist and canonical hash used by the production Worker.
    const hash = createHash('sha256').update(JSON.stringify(result)).digest('hex');
    const previous = records.get(result.id);
    if (previous && previous.hash !== hash) throw new Error(`Conflicting local attempt at line ${index + 1}.`);
    if (!previous) records.set(result.id, { result, createdAt: new Date(raw.createdAt).toISOString(), hash });
  }
  return [...records.values()];
}
const sqlValue = (value: string | number | null) => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replace(/'/g, "''")}'`;
export function importSql(records: ImportRecord[]): string {
  return records.map(({ result: r, createdAt, hash }) => {
    const sequence = r.preconditionResult ? { preconditionResult: r.preconditionResult } : r.stepResults;
    const values = [r.id, r.studentName, r.className, r.movementId, r.movementLabel, r.score, Number(r.passed), r.assessment,
      r.requiredCriteriaPassed === null ? null : Number(r.requiredCriteriaPassed), JSON.stringify(r.criteria), JSON.stringify(r.conciseFeedback),
      r.quality ? JSON.stringify(r.quality) : null, sequence ? JSON.stringify(sequence) : null,
      r.startedAt, r.finishedAt, r.processingLatencyMs, r.rubricVersion, createdAt, hash];
    return `INSERT INTO pose_results (id,student_name,class_name,movement_id,movement_label,score,passed,assessment,required_passed,criteria_json,feedback_json,quality_json,step_results_json,started_at,finished_at,processing_latency_ms,rubric_version,created_at,content_hash) VALUES (${values.map(sqlValue).join(',')}) ON CONFLICT(id) DO NOTHING;`;
  }).join('\n');
}
export function missingRecords(records: ImportRecord[], remote: { id: string; content_hash: string }[]): ImportRecord[] {
  const hashes = new Map(remote.map(row => [row.id, row.content_hash]));
  if (records.some(row => hashes.has(row.result.id) && hashes.get(row.result.id) !== row.hash)) {
    throw new Error('An attempt ID already exists with different content. Import stopped; existing records were not overwritten.');
  }
  return records.filter(row => !hashes.has(row.result.id));
}
function wrangler(database: string, args: string[]): any[] {
  const run = spawnSync(process.execPath, [path.join(root, 'node_modules/wrangler/bin/wrangler.js'),
    'd1', 'execute', database, '--remote', '--json', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  // Do not print SQL, student data, credentials or Wrangler debug output.
  if (run.error || run.status !== 0) {
    const output = `${run.stderr}\n${run.stdout}`;
    const reason = /fetch failed|network|ECONN|ETIMEDOUT/i.test(output) ? 'network failure' :
      /syntax error|SQLITE_ERROR/i.test(output) ? 'SQL rejected' :
      /upload|ingest/i.test(output) ? 'bulk upload failure' :
      /authenticate|token|login/i.test(output) ? 'authentication failure' : 'command failure';
    throw new Error(`Cloudflare: ${reason} (exit ${run.status}). Check Wrangler login and D1 schema, then retry.`);
  }
  // Bulk imports may include progress text around their JSON output. The caller
  // verifies every attempt against D1 afterwards rather than parsing progress.
  if (args.includes('--file')) return [];
  let response: any;
  try { response = JSON.parse(run.stdout); } catch { throw new Error('Cloudflare returned an unexpected response.'); }
  if (!Array.isArray(response) || response.some(item => item.success === false)) throw new Error('Cloudflare did not confirm success.');
  return response.flatMap(item => item.results ?? []);
}
async function remoteHashes(database: string, records: ImportRecord[]) {
  const rows: { id: string; content_hash: string }[] = [];
  for (let i = 0; i < records.length; i += 100) {
    rows.push(...wrangler(database, ['--command', `SELECT id,content_hash FROM pose_results WHERE id IN (${records.slice(i, i + 100).map(row => sqlValue(row.result.id)).join(',')})`]));
  }
  return rows;
}
async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--check-remote'].includes(arg))) throw new Error('Usage: npm run pose:sync:cloudflare -- [--check-remote | --apply]');
  // Fixed production target from this project's configuration; no arbitrary upload URL.
  const config = JSON.parse(await readFile(path.join(root, 'wrangler.jsonc'), 'utf8'));
  const database = config.d1_databases?.find((db: any) => db.binding === 'DB')?.database_name;
  if (typeof database !== 'string' || !database) throw new Error('Missing D1 DB binding.');
  const directory = process.env.SURVEY_DATA_DIR ? path.resolve(process.env.SURVEY_DATA_DIR) : path.join(root, 'data');
  const records = readImportRecords(await readFile(path.join(directory, 'pose_results.jsonl'), 'utf8'));
  console.log(`Validated ${records.length} unique AI Pose results. Target D1: ${database}.`);
  if (!records.length) return;
  if (!args.includes('--apply') && !args.includes('--check-remote')) {
    console.log('Local validation only. Use --check-remote to preview, or --apply to import missing results.');
    return;
  }
  const missing = missingRecords(records, await remoteHashes(database, records));
  console.log(`Already present: ${records.length - missing.length}. To import: ${missing.length}.`);
  if (!args.includes('--apply') || !missing.length) return;
  // Sensitive SQL stays in ignored data/, never in public/, dist/ or source control.
  const privateDirectory = path.join(root, 'data', '.pose-import');
  await mkdir(privateDirectory, { recursive: true, mode: 0o700 });
  const temporary = await mkdtemp(path.join(privateDirectory, 'run-'));
  try {
    for (let i = 0; i < missing.length; i += 100) {
      const file = path.join(temporary, `batch-${i}.sql`);
      await writeFile(file, importSql(missing.slice(i, i + 100)), { mode: 0o600 });
      wrangler(database, ['--file', file, '--yes']);
    }
    if (missingRecords(records, await remoteHashes(database, records)).length) throw new Error('Verification failed: some attempts are still missing. Retry safely.');
    console.log(`Verified all ${records.length} local attempts on Cloudflare. Existing results preserved.`);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
