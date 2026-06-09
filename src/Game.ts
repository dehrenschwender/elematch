import Phaser from "phaser"
import { SCREEN_HEIGHT, SCREEN_WIDTH } from './constants/game'
import { CANVAS_BG } from './util/responsive'
import { Menu } from './scene/Menu'
import { Game as GameScene } from './scene/Game'
import { Background } from './scene/Background'
import { Tutorial } from './scene/Tutorial'
import { ScoreOverlay } from './scene/ScoreOverlay'
import { Tutorial2 } from './scene/Tutorial2'
import { GameOver } from './scene/GameOver'
import { Preload } from './scene/Preload'
import { Settings } from './scene/Settings'

export class Game extends Phaser.Game {
  constructor () {
    super({
      type: Phaser.AUTO,
      title: 'ELEMATCH',
      // Keep the Phaser version banner in dev for debugging, but silence it in the
      // production console (where it is just noise).
      banner: !import.meta.env.PROD,
      // Canvas clear colour matches the camera margin fill, so scene transitions
      // (when no scene paints for a frame) never flash black.
      backgroundColor: CANVAS_BG,
      // RESIZE: the canvas fills its parent (#elematch-game-cointainer, stretched to
      // the full viewport in style.css) and updates on window resize. Each scene then
      // zoom-fits its main camera over the SCREEN_WIDTH×SCREEN_HEIGHT design space (see
      // makeResponsive in util/responsive.ts), so the game uses the full window width
      // without distorting or clipping the fixed-coordinate layout.
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: "elematch-game-cointainer",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      },
      scene: [
        Preload,
        Background, // This background scene is a total hack and is only used on the game screen
        Menu,
        Tutorial,
        Tutorial2,
        GameScene,
        ScoreOverlay,
        GameOver,
        // Registered last so the overlay renders above the Menu when launched.
        Settings
      ]
    })
  }
}
