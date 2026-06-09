import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../constants/game'
import { makeResponsive } from '../util/responsive'
import { isSoundEnabled, setSoundEnabled } from '../util/sound'

const PANEL_W = 760
const PANEL_H = 600
const CX = SCREEN_WIDTH / 2
const CY = SCREEN_HEIGHT / 2
const PANEL_LEFT = CX - PANEL_W / 2
const PANEL_TOP = CY - PANEL_H / 2
const PANEL_RIGHT = CX + PANEL_W / 2

const FONT = 'DisposableDroid'
const LINK = '#7ec8ff'
const LINK_HOVER = '#bfe3ff'
const MUTED = '#9bb4cf'

type Tab = 'sound' | 'about'
type VisibleObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible

interface Contributor {
  name: string
  url: string
}

// Credits — GitHub handles resolved from the repo's contributor history.
const CONTRIBUTORS: Contributor[] = [
  { name: 'Christian Potsch', url: 'https://github.com/Cyberdog66' },
  { name: 'Thomas Schaefer', url: 'https://github.com/Holly1337' },
  { name: 'Dirk Ehrenschwender', url: 'https://github.com/dehrenschwender' },
  { name: 'Jonas Braun', url: 'https://github.com/j-brn' },
]

export class Settings extends Phaser.Scene {
  private soundItems: VisibleObject[] = []
  private aboutItems: VisibleObject[] = []
  private soundTab!: Phaser.GameObjects.Text
  private aboutTab!: Phaser.GameObjects.Text
  private soundTabUnderline!: Phaser.GameObjects.Rectangle
  private aboutTabUnderline!: Phaser.GameObjects.Rectangle

  constructor (config?: Phaser.Types.Scenes.SettingsConfig) {
    super({ key: 'Settings', ...config })
  }

  create () {
    // Overlay scene: keep the camera transparent so the Menu shows through the dim.
    makeResponsive(this)
    this.soundItems = []
    this.aboutItems = []

    this.createInvisibleFontLoaderText()
    this.createBackdrop()
    this.createPanel()
    this.createTabs()
    this.createCloseButton()
    this.createSoundTab()
    this.createAboutTab()

    this.showTab('sound')

    // Esc closes the dialog.
    this.input.keyboard?.on('keydown-ESC', () => this.close())
  }

  private createBackdrop () {
    // Oversized so the dim also covers the responsive letterbox margins. Interactive
    // so it both blocks clicks reaching the Menu and closes on an outside click.
    const backdrop = this.add
      .rectangle(CX, CY, SCREEN_WIDTH * 4, SCREEN_HEIGHT * 4, 0x00070f, 0.72)
      .setInteractive()
    backdrop.on('pointerup', () => this.close())

    this.tweens.add({ targets: backdrop, alpha: { from: 0, to: 0.72 }, duration: 140 })
  }

  private createPanel () {
    const g = this.add.graphics()
    g.fillStyle(0x0c2340, 0.99)
    g.fillRoundedRect(PANEL_LEFT, PANEL_TOP, PANEL_W, PANEL_H, 28)
    g.lineStyle(3, 0x3a6ea5, 1)
    g.strokeRoundedRect(PANEL_LEFT, PANEL_TOP, PANEL_W, PANEL_H, 28)

    // Input blocker over the panel so clicks inside it never reach the backdrop
    // (which would otherwise close the dialog). topOnly input routing handles the rest.
    this.add.zone(CX, CY, PANEL_W, PANEL_H).setInteractive()

    this.add
      .text(CX, PANEL_TOP + 44, 'SETTINGS', { font: `40px ${FONT}`, color: '#ffffff' })
      .setOrigin(0.5)
  }

  private createTabs () {
    const y = PANEL_TOP + 106
    this.soundTab = this.makeTab(CX - 110, y, 'Sound', 'sound')
    this.aboutTab = this.makeTab(CX + 110, y, 'About', 'about')
    this.soundTabUnderline = this.add.rectangle(CX - 110, y + 26, this.soundTab.width, 3, 0x7ec8ff).setOrigin(0.5)
    this.aboutTabUnderline = this.add.rectangle(CX + 110, y + 26, this.aboutTab.width, 3, 0x7ec8ff).setOrigin(0.5)
  }

  private makeTab (x: number, y: number, label: string, tab: Tab): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, label, { font: `32px ${FONT}`, color: MUTED })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    t.on('pointerup', () => this.showTab(tab))
    return t
  }

  private createCloseButton () {
    const x = PANEL_RIGHT - 40
    const y = PANEL_TOP + 40
    const badge = this.add.circle(x, y, 22, 0x24405f).setInteractive({ useHandCursor: true })
    const cross = this.add.graphics()
    cross.lineStyle(4, 0xffffff, 1)
    cross.beginPath()
    cross.moveTo(x - 8, y - 8); cross.lineTo(x + 8, y + 8)
    cross.moveTo(x + 8, y - 8); cross.lineTo(x - 8, y + 8)
    cross.strokePath()
    badge.on('pointerover', () => badge.setFillStyle(0x365b82))
    badge.on('pointerout', () => badge.setFillStyle(0x24405f))
    badge.on('pointerup', () => this.close())
  }

  // ---- Sound tab ----------------------------------------------------------
  private createSoundTab () {
    const rowY = CY - 8
    const label = this.add
      .text(PANEL_LEFT + 70, rowY, 'Sound effects', { font: `34px ${FONT}`, color: '#ffffff' })
      .setOrigin(0, 0.5)

    const switchX = PANEL_RIGHT - 130
    const trackW = 120
    const trackH = 52
    const r = trackH / 2

    const track = this.add.graphics()
    const knob = this.add.circle(0, rowY, 21, 0xffffff)
    const stateText = this.add
      .text(switchX, rowY + 58, '', { font: `24px ${FONT}`, color: MUTED })
      .setOrigin(0.5)

    const paint = (on: boolean) => {
      track.clear()
      track.fillStyle(on ? 0x3fb56b : 0x46566b, 1)
      track.fillRoundedRect(switchX - trackW / 2, rowY - trackH / 2, trackW, trackH, r)
      stateText.setText(on ? 'On' : 'Off')
      stateText.setColor(on ? '#9be7b4' : MUTED)
    }

    const on = isSoundEnabled()
    knob.x = on ? switchX + trackW / 2 - r : switchX - trackW / 2 + r
    paint(on)

    const hit = this.add
      .zone(switchX, rowY, trackW + 24, trackH + 24)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    hit.on('pointerup', () => {
      const next = !isSoundEnabled()
      setSoundEnabled(this.game, next)
      paint(next)
      this.tweens.add({
        targets: knob,
        x: next ? switchX + trackW / 2 - r : switchX - trackW / 2 + r,
        duration: 130,
        ease: 'Quad.easeOut',
      })
    })

    const hint = this.add
      .text(CX, rowY + 132, 'Mute or unmute all in-game sound effects.', {
        font: `22px ${FONT}`,
        color: MUTED,
      })
      .setOrigin(0.5)

    this.soundItems.push(label, track, knob, stateText, hit, hint)
  }

  // ---- About tab ----------------------------------------------------------
  private createAboutTab () {
    const icon = this.add.image(CX, PANEL_TOP + 212, 'appIcon').setDisplaySize(112, 112)
    const title = this.add
      .text(CX, PANEL_TOP + 300, 'ELEMATCH', { font: `48px ${FONT}`, color: '#ffffff' })
      .setOrigin(0.5)
    const url = this.makeLink(CX, PANEL_TOP + 344, 'elemat.ch', 'https://elemat.ch', 26)
    const creditsHeading = this.add
      .text(CX, PANEL_TOP + 398, 'Contributors', { font: `26px ${FONT}`, color: MUTED })
      .setOrigin(0.5)

    this.aboutItems.push(icon, title, ...url, creditsHeading)

    CONTRIBUTORS.forEach((c, i) => {
      const link = this.makeLink(CX, PANEL_TOP + 440 + i * 36, c.name, c.url, 24)
      this.aboutItems.push(...link)
    })
  }

  /** Underlined, hoverable text link that opens `url` in a new tab. */
  private makeLink (x: number, y: number, label: string, url: string, size: number): VisibleObject[] {
    const t = this.add
      .text(x, y, label, { font: `${size}px ${FONT}`, color: LINK })
      .setOrigin(0.5)
    // Pad the hit area to a ~44px-tall finger-friendly target (the raw text is
    // only ~size px tall). Hit-area coords are in the text's top-left local space.
    const hitH = 44
    const padX = 16
    t.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-padX, (t.height - hitH) / 2, t.width + padX * 2, hitH),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })
    const underline = this.add
      .rectangle(x, y + size * 0.6, t.width, 2, 0x7ec8ff)
      .setOrigin(0.5)
    t.on('pointerover', () => { t.setColor(LINK_HOVER); underline.setFillStyle(0xbfe3ff) })
    t.on('pointerout', () => { t.setColor(LINK); underline.setFillStyle(0x7ec8ff) })
    t.on('pointerup', () => window.open(url, '_blank', 'noopener,noreferrer'))
    return [t, underline]
  }

  // ---- Tab switching ------------------------------------------------------
  private showTab (tab: Tab) {
    const sound = tab === 'sound'
    this.soundItems.forEach((o) => o.setVisible(sound))
    this.aboutItems.forEach((o) => o.setVisible(!sound))

    this.soundTab.setColor(sound ? '#ffffff' : MUTED)
    this.aboutTab.setColor(sound ? MUTED : '#ffffff')
    this.soundTabUnderline.setVisible(sound)
    this.aboutTabUnderline.setVisible(!sound)
  }

  private close () {
    this.scene.stop()
  }

  private createInvisibleFontLoaderText () {
    this.add.text(0, 0, ':O', { font: `40px ${FONT}` }).setVisible(false)
  }
}
