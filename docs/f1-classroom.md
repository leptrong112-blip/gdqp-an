# F-1 classroom exterior model

Asset: `public/models/f1-classroom.glb` (approximately 320 KiB).

This is an original stylized, inert exterior illustration in arbitrary display units. It contains four named groups: `body`, `crown`, `lever`, `ring`. There are no functional internals, explosive contents, manufacturing dimensions or operational sequences.

The embedded `ExploreExterior` clip lasts 1.6 seconds and separates the display groups simultaneously. The website samples the clip forwards/backwards for expand/collapse, including reversal during a transition. Clicking the intact prop expands it; clicking a separated group or a sidebar entry highlights and frames that part. Orbit dragging remains available; the reset view returns to the whole display. The information panel describes exterior recognition only.

Rebuild with `node scripts/build-f1-classroom.mjs`. The generator uses Three.js geometry and GLTFExporter without external textures or assets. `F1ClassroomModel.tsx` controls animation, selection and camera framing; `WebARSection.tsx` supplies the shared controls and information panel. The previous `grenade.glb` remains untouched.

Validated: TypeScript, production build, GLTFLoader import and animation sampling at 0 / 1.6 / 0.8 / 0 seconds, plus browser inspection of the assembled view, click-to-expand, direct part selection, smooth camera zoom and matching information panel. Existing build warnings concern CSS import ordering and bundle sizes.
