import { BaseScene } from './BaseScene'
import background from '../assets/images/background-with-area.png'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/game'
import { makeResponsive } from '../util/responsive'

export class Background extends BaseScene {
  constructor (props?: Phaser.Types.Scenes.SettingsConfig) {
    super({
      key: 'Background',
      ...props
    })
  }

  create () {
    // Bottom of the gameplay scene stack: paint the margin fill behind the design.
    makeResponsive(this, { fillBackground: true })
    this.createBackground()
  }

  createBackground () {
    this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'background')
  }
}
