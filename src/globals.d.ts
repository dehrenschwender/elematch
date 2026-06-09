// Phaser ships a top-level `declare namespace Phaser`, so this reference makes the
// global `Phaser` (set at runtime by ./phaser-global) available as both a type and a
// value across every module without an explicit import.
/// <reference types="phaser" />

// Vite's ambient types: typed `import.meta.glob` and the asset-module declarations that
// let `import url from './foo.png'` (and .wav/.ttf/.css) resolve to a string URL.
/// <reference types="vite/client" />
