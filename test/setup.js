// The game-logic modules (CardStack, GameState) reference the global `Phaser`
// namespace that Phaser's UMD build installs at runtime. The only Phaser API the
// pure logic touches is Phaser.Utils.Array.Shuffle, so we stub it deterministically
// (identity shuffle) to keep set-detection tests reproducible without pulling in the
// full WebGL/canvas engine under Node.
globalThis.Phaser = {
  Utils: {
    Array: {
      Shuffle: (array) => array
    }
  }
};
