# Arcade range — continuation verification

Continued from the existing working tree after inspecting git status/diff and reading the current arcade files. No components were replaced or duplicated. This pass changed only `arcadeRangeLogic.ts`, `ArcadeRangeSection.tsx`, `ShootingRange3D.tsx` and this report; build output was regenerated. Other working-tree edits were left alone.

Changes:

- Replaced the large cyan sphere and exaggerated curved animation with a thin warm tracer and brief visual recoil. Fictional flight timing is 0.105–0.2 seconds for the current levels; it is not calibrated to a real weapon.
- Fixed a stale-frame aim bug: a quick pointer move/click could fire toward the preceding frame's aim and award an incorrect hit. Pointer fire now supplies its click coordinates synchronously; frame rendering and firing share the same rotation helper.
- Added a round-generation guard to reload callbacks and derived the score rows from each exercise's target count.

Verified in the running localhost app through browser UI:

| Check | Result |
| --- | --- |
| 3 × 4 exercise | 12 results, 2 reloads, completion; no extra magazine |
| 3 × 6 exercise | 18 results, 2 reloads; targets moved |
| 4 × 5 exercise | 20 results, 3 reloads, completion |
| Empty/reloading/paused fire | Disabled; no extra ammunition or score |
| Space and R | Fire/reload worked from focused controls |
| Pause during reload | Stayed at 50% for 1.5 seconds; resumed correctly |
| Pause moving targets | Observed label position stayed unchanged |
| Switch during reload | New exercise retained initial ammunition and zero score |
| Switch immediately after firing | New exercise retained zero score |
| Quick click outside the target | Miss, zero points after the aim fix |
| Legacy simulator smoke test | Existing 10m shot advanced 0/5 to 1/5 |
| Runtime console | No errors; dependency THREE.Clock deprecation warnings |

Final checks: `npm.cmd run lint`, `node --test scripts/tests/arcade-range.test.ts` (5 passed), and `npm.cmd run build` passed. Existing build warnings concern CSS import ordering, mixed static/dynamic imports, and bundle size.
