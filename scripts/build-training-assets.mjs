import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [process.env.BLENDER_BIN, 'blender', 'D:/Blender/blender.exe',
  'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe',
  'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe',
  '/Applications/Blender.app/Contents/MacOS/Blender'].filter(Boolean);
const blender = candidates.find((candidate) => {
  if (candidate !== 'blender' && !existsSync(candidate)) return false;
  return spawnSync(candidate, ['--version'], { encoding: 'utf8', windowsHide: true }).status === 0;
});
if (!blender) {
  console.error('Blender was not found. Set BLENDER_BIN to its executable. The website can use the checked-in GLBs without Blender.');
  process.exit(1);
}
for (const script of ['animate_soldier.py', 'build_training_ground.py']) {
  console.log(`Building ${script} with ${blender}`);
  const result = spawnSync(blender, ['-b', '--python-exit-code', '1', '-P', path.join(root, 'scripts/blender', script)],
    { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('Training GLBs and Blender sources are ready.');
