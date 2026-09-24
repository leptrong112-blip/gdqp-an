import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { POSE_CONFIG } from '../../src/features/pose-analysis/config';

test('configured Full model is bundled intact for same-origin offline inference', () => {
  const model = readFileSync(new URL(`../../public${POSE_CONFIG.modelPath}`, import.meta.url));
  assert.equal(model.length, 9398198);
  assert.equal(createHash('sha256').update(model).digest('hex'),
    '5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1');
});
