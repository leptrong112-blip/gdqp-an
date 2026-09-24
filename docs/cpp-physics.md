# C++ / WebAssembly scene physics

The first module implements constant-acceleration motion and exact contact with
a horizontal ground plane. C++ is compiled to a small freestanding WASM module,
with no host imports, allocation, network, native runtime or server requirement.

## Integration

- `GrenadeSimulation`: samples motion from absolute simulation time, rotates the
  launch with the character, stops exactly on the ground, places the visual
  particle effect at that contact and reports whether it is inside the marked
  circle. Reset clears both the flight and the old particle effect. Character
  orientation is locked during an attempt.
- `ShootingRange3D` arcade mode: samples a stylized curve between the existing
  start/end positions. Existing game timing, aim, target motion and scoring are
  retained. Pausing freezes simulation time; disposal resolves a pending shot.
- The normal range remains on its existing scoring ray.

These are illustrative game motions in scene units. There are no calibrated
weapon properties, real-world ballistic tables, wind corrections, explosive
effects or damage models. This is a reusable motion foundation, not a completed
general collision/rigid-body engine. Performance improvements are not claimed:
this small workload is intended to establish a tested C++/web integration.

## Runtime and fallback

Vite imports `projectile.wasm?url` and emits a content-hashed asset (or inlines a
small binary). The first consumer loads it once. A flight captures its engine
at launch so loading completion cannot switch an active trajectory. Fetch has
an 8-second timeout. Loading/ABI failure uses the equivalent JavaScript path and
logs a diagnostic; a later mount can retry. No special MIME configuration,
cross-origin isolation, extra server or pthread headers are necessary.

The scene time step limits long gaps after tab suspension. It is deliberately
not wall-clock catch-up; ordinary 30/60/144 FPS sampling follows the same curve.

## Rebuild

Obtain WASI SDK from https://github.com/WebAssembly/wasi-sdk/releases.
The initial binary was built with WASI SDK 27.0 (Clang, C++17).
Set `WASI_SDK_PATH` to its extracted directory, or set `WASM_CXX` to the absolute
path of a Clang C++ compiler with `wasm-ld`. On this Windows workspace the default
is `scratch/wasm-toolchain/wasi-sdk-27.0-x86_64-windows` (ignored by Git).

```text
npm run physics:build
npm run test:physics
npm run lint
npm run build
```

Commit C++ source, WASM binary and `native/physics/build.json` together. Ordinary
frontend/server builds verify source and binary SHA-256 hashes and require no
C++ compiler on the deployment host. The lockfile's npm dependencies are
unchanged. `physics:verify` also rejects binaries with host imports.

Tests instantiate the actual C++ binary in Node and check analytical values,
ground crossings, input validation, frame-rate independence, reset isolation,
arcade endpoints and parity with fallback.

Local browser smoke verification completed on 2026-09-19:

- Opened Training → textbook skills → throwing → 3D, ran the authored animation,
  observed the ground-contact report, then reset to the ready state.
- Opened the arcade range, started a round and fired; the game recorded one
  consumed round and one scored impact after the animation completed.
- TypeScript checks, production build and 18 Node test entries passed (including
  the existing training-runtime suite). Existing CSS import-order and bundle-size
  build warnings remain.

Physical mobile-device/long-session performance has not been benchmarked.
