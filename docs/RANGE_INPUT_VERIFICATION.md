# Range input verification — 2026-09-16

This patch extends the current range implementation. Existing working-tree changes to admin, WebAR, training, dependencies and assets were left intact.

## Changes

- Shared native mouse input hook for simulator and arcade: real Pointer Lock, relative look, pitch clamp, first-click acquisition without firing, button bitmask for simultaneous ADS/fire, cleanup on round changes/unmount/blur.
- Gameplay-only Fullscreen API with fullscreenchange state tracking.
- Six visual-only ADS offsets, existing interpolation, preview guide, reset and guarded localStorage persistence. No scoring or real-world calibration parameters changed.
- Simulator cooldown ref and timer cleanup prevent duplicate input/stale completion. Existing touch handlers remain separate from desktop mouse events.

## Checks performed

- `npm.cmd run lint`: pass (application and Cloudflare TypeScript).
- `npm.cmd run build`: pass.
- `node --import tsx --test scripts/tests/arcade-range.test.ts scripts/tests/training-runtime.test.ts`: 6 test entries pass, including all 5 arcade tests and the training runtime suite.
- Development browser fixture `/scripts/range-input-smoke.html`: 17 assertions pass. Covers right-held ADS + left fire, left release retaining ADS, right release, movement, lock loss, reacquisition, settings/persistence/reset, pitch clamp, inactive blocking, touch compatibility-event suppression and listener cleanup. Pointer Lock is mocked in this fixture only.
- Actual app: fullscreen entry/exit by button; gameplay alone fills screen, controls update. ADS preview slider changes display, survives page reload and resets. Simulator fire button consumes exactly one round and adds one score row.
- Actual arcade: 12/12 rounds, 3 magazines, 2 reloads, 12 history rows. Empty magazine disables firing. Pause during reload freezes at 33%; resume finishes reload. Completion disables firing. Next exercise resets score/ammo to 0/18 and magazine 1 with 6 rounds.
- Fresh browser load, simulator start, arcade switch/start: no console errors. During source hot replacement an earlier tab recorded a hook-order error; it did not recur in the clean session.

## Verification limits and existing warnings

- The integrated browser rejects real Pointer Lock requests. Its synthesized Escape also did not exit native fullscreen. Real hardware right+left interaction, cursor disappearance and native Escape still need checking in a normal desktop browser; the mocked input tests are not a substitute for that check.
- No physical multi-touch device was available. Touch handlers were preserved and compatibility-mouse suppression tested; actual multi-touch ADS/aim/fire remains unverified.
- Build reports existing CSS @import ordering, mixed static/dynamic Gamification import and a large main bundle (~2.36 MB uncompressed). Three.js Clock deprecation warning remains.

## Desktop acceptance sequence

Start an exercise → fullscreen → click scene once (ammo unchanged) → move mouse → hold right → press/release left (one shot, ADS remains) → release right → Escape → click scene to regain control. Open settings after releasing lock; adjust/reset/reload. Exit fullscreen and confirm layout recovery. Repeat on a touch device using the existing ADS/fire buttons without requesting Pointer Lock.
