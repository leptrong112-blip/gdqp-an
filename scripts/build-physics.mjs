import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pose = process.argv.includes('--pose');
const source = resolve(root, pose ? 'native/pose/sequence.cpp' : 'native/physics/projectile.cpp');
const output = resolve(root, pose ? 'src/features/pose-analysis/scoring/sequence.wasm' : 'src/features/physics/projectile.wasm');
const manifestPath = resolve(root, pose ? 'native/pose/build.json' : 'native/physics/build.json');
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');

if (process.argv.includes('--verify')) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.sourceSha256 !== hash(source) || manifest.wasmSha256 !== hash(output)) {
    throw new Error(`WASM is stale or modified. Run npm run ${pose ? 'pose:build' : 'physics:build'}.`);
  }
  const module = new WebAssembly.Module(readFileSync(output));
  if (WebAssembly.Module.imports(module).length) throw new Error('Physics must have no host imports');
  console.log(`${pose ? 'Pose sequence' : 'Physics'} WASM verified (${readFileSync(output).length} bytes).`);
} else {
  const sdk = process.env.WASI_SDK_PATH || resolve(root, 'scratch/wasm-toolchain/wasi-sdk-27.0-x86_64-windows');
  const compiler = process.env.WASM_CXX || resolve(sdk, 'bin', process.platform === 'win32' ? 'clang++.exe' : 'clang++');
  if (!existsSync(compiler)) throw new Error('Set WASI_SDK_PATH to your extracted WASI SDK, or WASM_CXX to a clang++ with wasm-ld.');
  const args = ['--target=wasm32-unknown-unknown', '-std=c++17', '-O3', '-nostdlib', '-fno-exceptions', '-fno-rtti', '-ffp-contract=off', '-Wl,--no-entry', '-Wl,--strip-all', source, '-o', output];
  const result = spawnSync(compiler, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
  writeFileSync(manifestPath, JSON.stringify({ abi: 1, sourceSha256: hash(source), wasmSha256: hash(output), flags: args.slice(0, -3) }, null, 2) + '\n');
  console.log(`Built C++ ${pose ? 'pose sequence' : 'physics'} (${readFileSync(output).length} bytes).`);
}
