interface TwoStateButtonOptions {
  texturePressed?: string;
  onClick?: () => void;
}

export class TwoStateButton extends Phaser.GameObjects.Image {
  textureNotPressed: string;
  texturePressed?: string;
  onClick?: () => void;

  constructor (
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    { texturePressed, onClick }: TwoStateButtonOptions = {},
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame)
    this.textureNotPressed = texture
    this.texturePressed = texturePressed
    this.onClick = onClick

    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', () => {
      this.setPressed(true)
    })
    this.on('pointerup', this.onFocusEnd)
    this.on('pointerout', () => {
      this.setPressed(false)
    })
  }

  setPressed (isPressed: boolean) {
    this.setTexture(isPressed ? (this.texturePressed as string) : this.textureNotPressed)
  }

  onFocusEnd () {
    if (typeof this.onClick === 'function') {
      this.onClick()
    }
    this.setPressed(false)
  }
}
