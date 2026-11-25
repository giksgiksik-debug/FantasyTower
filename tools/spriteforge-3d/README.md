# SpriteForge 3D — Android-first asset studio

## Current asset: Cat Wizard Tower
- Detailed procedural Three.js 3D model: orange-and-white wizard cat, blue star hat, robe, staff with attached magic orb, stone turret, paw banner, glowing windows, crystals and garden base.
- Orthographic isometric preview with touch orbit and pinch zoom.
- Transparent 512×512 PNG sprite export.
- GLB export for reuse in a 3D pipeline.
- Recipe storage in IndexedDB.
- PWA shell for Chrome on Android.

## Run
Serve this folder over HTTPS (GitHub Pages or another static HTTPS host), then open it in Chrome on Android and choose Install app / Add to Home screen.

The first launch requires internet to load Three.js modules. The service worker caches loaded modules for subsequent offline use.

## Important
The cat wizard is generated from editable Three.js geometry, not a flattened reference illustration. PNG is a rendered 2D image; GLB is the reusable 3D scene. The current model is a first procedural pass and will be refined after viewing it on the phone.
