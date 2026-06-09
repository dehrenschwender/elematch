import { BaseScene } from './BaseScene'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/game'
import { TwoStateButton } from '../Buttons/TwoStateButton'
import buttonNewgame from '../assets/images/buttons/button-newgame.png'
import buttonNewgameActive from '../assets/images/buttons/button-newgame-active.png'
import buttonTutorial from '../assets/images/buttons/button-tutorial.png'
import buttonTutorialActive from '../assets/images/buttons/button-tutorial-active.png'
import startBackground from '../assets/images/start.png'
import { makeResponsive } from '../util/responsive'

export class Menu extends BaseScene {
  constructor (config?: Phaser.Types.Scenes.SettingsConfig) {
    super({
      key: 'Menu',
      ...config
    })
  }

  init () {

  }

  create () {
    makeResponsive(this, { fillBackground: true })
    this.add.image(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 'startBackground')
    this.createInvisibleFontLoaderText()
    this.addStartButton()
    this.addTutorialButton()
    this.addSettingsButton()
  }

  addSettingsButton () {
    // Self-contained cog badge in the top-right corner that opens the Settings overlay.
    const badge = this.add.circle(0, 0, 34, 0x0b2740, 1).setStrokeStyle(2, 0x3a6ea5)

    const gear = this.add.graphics()
    gear.fillStyle(0xffffff, 1)
    const teeth = 8
    for (let i = 0; i < teeth; i++) {
      gear.save()
      gear.rotateCanvas((i / teeth) * Math.PI * 2)
      gear.fillRect(-5, -27, 10, 13)
      gear.restore()
    }
    gear.fillCircle(0, 0, 18)
    gear.fillStyle(0x0b2740, 1)
    gear.fillCircle(0, 0, 7)

    const cog = this.add.container(SCREEN_WIDTH - 72, 70, [badge, gear])

    badge.setInteractive({ useHandCursor: true })
    badge.on('pointerup', () => {
      if (!this.scene.isActive('Settings')) {
        this.scene.launch('Settings')
      }
    })
    badge.on('pointerover', () => this.tweens.add({ targets: cog, scale: 1.08, duration: 100 }))
    badge.on('pointerout', () => this.tweens.add({ targets: cog, scale: 1, duration: 100 }))
  }

  addStartButton () {
    const button = new TwoStateButton(
      this,
      SCREEN_WIDTH / 2,
      360 + 43,
      'buttonNewgame',
      {
        texturePressed: 'buttonNewgameActive',
        onClick: this.switchToGameScene.bind(this)
      }
    )
    this.children.add(button)
  }

  switchToGameScene () {
    this.scene.start('Game')
  }

  addTutorialButton () {
    const button = new TwoStateButton(
      this,
      SCREEN_WIDTH / 2,
      460 + 43,
      'buttonTutorial',
      {
        texturePressed: 'buttonTutorialActive',
        onClick: this.switchToTutorialScene.bind(this)
      }
    )
    this.children.add(button)
  }

  switchToTutorialScene () {
    this.scene.start('Tutorial')
  }

  createInvisibleFontLoaderText () {
    const text = this.add.text(0,0, ':O', { font: `${40}px DisposableDroid` })
    text.setVisible(false)
  }
}
