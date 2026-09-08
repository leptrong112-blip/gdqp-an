# AKM range scene

`src/components/ShootingRange3D.tsx` loads `/models/akm.glb` at its authored scale (metres). The existing React simulator keeps exercise selection, audio, ammunition, results and XP.

The imported hierarchy already converts the asset's axes to X right, Y up, -Z forward. Sight landmarks in that space are rear `(0, .131485, -.19994)` and front `(0, .126158, -.58458)`. `ALIGN` rotates the line between them onto -Z; `MODEL_OFFSET` puts the rear landmark at the rig origin. The rig sits at Y=1.55. ADS eye relief is .22m, near clipping .005m. Both camera position and lookAt are transformed by the same aiming rig as the weapon. Exponential lerp moves between free/ADS eyes and 60/42 degree FOVs; it is frame-rate independent and can reverse mid-transition.

Right mouse holds ADS; Q, middle mouse or the ADS button toggle it. Shift/the breath button toggle reduced sway for four seconds. Blur, mouse release and leaving the viewport release temporary ADS. Left mouse, Space/Enter or the fire button use the currently rendered aim.

Targets use the existing target dimensions and distances: 10, 100, 150 and 200m from the neutral ADS eye. The selected board occupies the central lane; other boards move to the side lane so close boards do not block the active target. This is a visual game simulation: fixed model sights and simplified scoring rings, without real ballistics or adjustable rear-sight elevation. The old pixel-based ballistic offsets and nonfunctional elevation selector were removed from the simulator; handbook content remains separate.

Impacts intersect the active board plane using the rig's sight ray. Coordinates and marks are in target-local millimetres, independent of screen dimensions or ADS interpolation. The same ring spacing draws the board and computes scores.

For screen readability, target dimensions are multiplied by 4, 7, 9 and 11 at 10, 100, 150 and 200m respectively (`TARGET_DISPLAY_SCALE`). These are display aids, not real target dimensions. Angular width still decreases with distance; aspect ratios are preserved. Rendering and scoring share the enlarged dimensions, and impact markers scale accordingly. Tall boards are raised clear of the ground and the neutral aim follows their centre. Thicker ring strokes remain visible at small projected sizes.

Validation: TypeScript/build plus browser inspection of free view, ADS alignment, scoring and exercise selection. Model landmarks can be tuned in the constants above if the GLB is replaced.
