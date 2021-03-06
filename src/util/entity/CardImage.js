import { getTextureNameForCard } from './Card'

export class CardImage extends Phaser.GameObjects.Image {
  constructor ({ scene, x, y, image, id, element, count, color, level }) {
    super(scene, x, y, image);
    this.element = element;
    this.count = count;
    this.color = color;
    this.level = level;

    this.setSize(130,170)
    this.setDataEnabled();
    this.setData("state", {element, count, color, level});
    this.setTexture(image);
    this.setPosition(x, y);
    this.setScale(1);
    this.setInteractive({useHandCursor: true});

    this.addListener('pointerdown', () => {
      this.onClickDown({id: id, data: {element, count, color, level}})
    });
  }

  onClickDown(card) {
    const gameScene = this.scene.scene.get("Game")
    gameScene.data.get("gameState").toggleCard(card);
    gameScene.events.emit("changedata", gameScene.data.get("gameState"));
  }

  setSelected(state) {
    if (state) {
      this.setTexture(getTextureNameForCard(this, "full"))
    } else {
      this.setTexture(getTextureNameForCard(this, "half"))
    }
    this.setActive(state)
  }

  noMatchAnimation() {
    let timeline = this.scene.tweens.createTimeline();

    timeline.add({
      targets: this,
      angle: 4,
      duration: 40,
      ease: 'Power2',
      yoyo: true,
    })
    timeline.add({
      targets: this,
      angle: -4,
      duration: 40,
      ease: 'Power2',
      yoyo: true,
    })
    timeline.add({
      targets: this,
      angle: 4,
      duration: 40,
      ease: 'Power2',
      yoyo: true,
    })
    timeline.add({
      targets: this,
      angle: -4,
      duration: 40,
      ease: 'Power2',
      yoyo: true,
    })

    timeline.play();
  }
}
