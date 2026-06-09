import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/game'

/**
 * Colour shown in the margins around the centred design when the window's aspect
 * ratio differs from the design's 1280:740. Matches the dark edges of the game art
 * so the fill reads as intentional rather than as letterbox bars.
 */
export const CANVAS_BG = '#070b1a'

interface ResponsiveOptions {
  /**
   * Whether this scene's camera should paint {@link CANVAS_BG} behind the design.
   * Set true ONLY for the bottom-most scene in a stack (a standalone screen, or the
   * gameplay Background scene). Overlay scenes (CardGrid/ScoreOverlay/LastMatch) must
   * stay transparent so the scene beneath shows through.
   */
  fillBackground?: boolean
}

/**
 * Make a scene render its fixed {@link SCREEN_WIDTH}×{@link SCREEN_HEIGHT} design
 * responsively under `Phaser.Scale.RESIZE`: the main camera is zoomed to fit the
 * current canvas and centred on the design, then re-fitted on every window resize.
 *
 * Because the *camera* — not each game object — is transformed, all existing fixed
 * coordinates keep working unchanged, and Phaser's pointer hit-testing (which runs
 * through the camera) stays correct. The zoom uses `min(w/W, h/H)` so the board is
 * never clipped; on a window narrower in aspect than the design (the common case)
 * width is the binding dimension, so the game spans the full width.
 */
export function makeResponsive(scene: Phaser.Scene, { fillBackground = false }: ResponsiveOptions = {}): void {
  const fit = () => {
    const cam = scene.cameras.main
    if (!cam) {
      return
    }
    const { width, height } = scene.scale
    cam.setSize(width, height)
    cam.setZoom(Math.min(width / SCREEN_WIDTH, height / SCREEN_HEIGHT))
    cam.centerOn(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2)
    if (fillBackground) {
      cam.setBackgroundColor(CANVAS_BG)
    }
  }

  fit()
  scene.scale.on(Phaser.Scale.Events.RESIZE, fit)
  // The ScaleManager outlives scenes, and scenes here are torn down both by stop
  // (SHUTDOWN, on scene.start transitions) and by scene.remove() (DESTROY, in
  // Game.endGame). Drop the listener on either so we don't leak one fit() per scene
  // per game. (off() is idempotent, so handling both events is safe.)
  const cleanup = () => scene.scale.off(Phaser.Scale.Events.RESIZE, fit)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup)
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup)
}
