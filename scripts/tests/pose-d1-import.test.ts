import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { finalPoseSubmission, finalDrillSubmission } from './fixtures/pose/result';
import { readImportRecords, importSql, missingRecords } from '../pose-d1-import';

const line = (result: unknown) => JSON.stringify({ ...(result as object), createdAt: '2026-10-06T00:00:00.000Z' });
test('D1 import preserves scores, Vietnamese names, preparation/drill data and is idempotent', () => {
  const pre = finalDrillSubmission().stepResults![0];
  const source = [finalPoseSubmission({ studentName: "Nguyễn O'Brien", movementId: 'turnLeft', preconditionResult: pre }), finalDrillSubmission()];
  const records = readImportRecords(source.map(line).join('\n'));
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync('migrations/0004_pose_results.sql', 'utf8'));
    db.exec(importSql(records)); db.exec(importSql(records));
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM pose_results').get()!.n, 2);
    const stored = db.prepare('SELECT * FROM pose_results WHERE id=?').get(source[0].id)!;
    assert.equal(stored.student_name, "Nguyễn O'Brien");
    assert.equal(stored.score, source[0].score);
    assert.deepEqual(JSON.parse(stored.step_results_json as string), { preconditionResult: pre });
    assert.deepEqual(JSON.parse(db.prepare('SELECT step_results_json FROM pose_results WHERE id=?').get(source[1].id)!.step_results_json as string), source[1].stepResults);
    const remote = db.prepare('SELECT id,content_hash FROM pose_results').all() as any[];
    assert.equal(missingRecords(records, remote).length, 0);
    assert.throws(() => missingRecords(records, [{ id: source[0].id, content_hash: 'different' }]), /different content/);
    // Even a concurrent conflicting insert never replaces production data.
    db.exec(importSql(readImportRecords(line({ ...source[0], studentName: 'Changed' }))));
    assert.equal(db.prepare('SELECT student_name FROM pose_results WHERE id=?').get(source[0].id)!.student_name, "Nguyễn O'Brien");
  } finally { db.close(); }
});
test('import validates the complete file and strips private camera/session fields', () => {
  const source = finalPoseSubmission();
  const records = readImportRecords(line({ ...source, image: 'PRIVATE', rawLandmarks: ['PRIVATE'], token: 'PRIVATE' }));
  assert.ok(!importSql(records).includes('PRIVATE'));
  assert.equal(readImportRecords(line(source) + '\n' + line(source)).length, 1);
  assert.throws(() => readImportRecords(line(source) + '\n' + line({ ...source, score: 101 })), /Invalid result/);
  assert.throws(() => readImportRecords(line(source) + '\n' + line({ ...source, studentName: 'Other' })), /Conflicting/);
  assert.throws(() => readImportRecords('{broken'), /Invalid JSON/);
});
