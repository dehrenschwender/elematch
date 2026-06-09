// Most modules in this project reference Phaser via the bare global `Phaser`
// (e.g. `class CardImage extends Phaser.GameObjects.Image`). Webpack's bundle of
// Phaser's UMD build happened to install that global as a side effect of import
// order. Vite resolves Phaser's ESM build (dist/phaser.esm.js), which does NOT set
// a global, so we set it explicitly here. Importing this module before anything
// else (see src/index.ts) guarantees the global exists before any scene/entity
// class is evaluated.
import Phaser from 'phaser'

;(globalThis as { Phaser?: typeof Phaser }).Phaser = Phaser

export default Phaser
