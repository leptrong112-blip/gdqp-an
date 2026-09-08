# Training ground material finish

This pass colors the existing `public/models/training/training-ground.glb`. It does not regenerate the scene, move objects, change cameras, or edit the soldier asset.

The original export used a white `organic` material but omitted `COLOR_0` attributes. The material pass adds normalized vertex colors and glTF PBR material variants:

- Muted grass greens, warm dirt, lighter walking paths, grey formation paving, dry open ground, and darker trench earth.
- Three foliage palettes, varied shrubs and grass, brown bark, and subtle spatial variation.
- Brown timber, dark green signs, grey concrete, terracotta brick, dusty khaki sandbags, and subdued metal finishes.

The palette is in `scripts/training-material-palette.json`; hex colors are converted from sRGB into linear glTF vertex colors. Colors use 16-bit normalized channels, with no texture downloads or new geometry. Natural-surface edges blend into the surrounding ground. Runtime polygon offset separates coplanar paving/paths/markings without changing their positions, and flat overlays do not cast shadows.

## Apply colors to the current asset

```powershell
npm run assets:polish
npm run assets:verify-materials
npm run lint
npm run build
```

The polish command reads the current GLB, preserves unknown material assignments and pre-existing color attributes it does not own, and updates only its own colors on subsequent runs. It saves the first untouched input at `artifacts/training/training-ground-before-materials.glb`. Do not use `assets:build` for a color-only pass: that command rebuilds geometry.

The verifier compares the backup with the result, checks that all original geometry bytes, indices, nodes, transforms, and scene hierarchy remain unchanged, then loads the GLB with Three.js to verify vertex colors. Detailed output is in `artifacts/training/material-polish-verification.json`.

## Blender source copy

```powershell
& 'D:\Blender\blender.exe' -b --python-exit-code 1 -P scripts/blender/apply_training_materials.py
```

This transfers the finished colors into the current Blender source and saves a separate `assets/blender/training-ground-materials.blend`. The original `training-ground.blend` remains untouched. The script verifies geometry and transforms before saving. For future full regeneration, the generator's vertex-color detection now checks the Blender node type instead of its display name.
