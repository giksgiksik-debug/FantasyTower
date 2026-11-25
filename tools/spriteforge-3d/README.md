# SpriteForge 3D — mobile prototype

Standalone Android-first PWA for procedural isometric game assets.

## Prototype 0.1
- Procedural low-poly stone defense tower (archer / cannon / magic presets)
- Live Three.js viewport with touch orbit and pinch zoom
- Orthographic isometric camera
- Adjustable height, width, roof, material and detail
- Transparent 512x512 PNG export
- GLB model export
- Recipe save to IndexedDB
- PWA shell and runtime cache

## Run
Serve this folder over HTTPS (GitHub Pages or another static HTTPS host), then open it in Chrome on Android and choose **Install app / Add to Home screen**.

The first launch requires an internet connection to load Three.js modules. The service worker caches loaded modules for subsequent offline use.

## Notes
This is an isolated tool branch and does not modify the game's active branch.