import { MAX_LIVES, MIN_LIVES } from '../../constants/game'

export class LifeBar extends Phaser.GameObjects.Image {
  lifes: number;

  constructor (scene: Phaser.Scene, x: number, y: number, texture?: string, frame?: string | number) {
    super(scene, x, y, texture as string, frame)
    this.lifes = 5
    this.setLifes(this.lifes)
  }

  setLifes (lifes: number) {
    lifes = Math.max(lifes, MIN_LIVES)
    lifes = Math.min(lifes, MAX_LIVES)
    this.setTexture(`indicatorBar${lifes}`)
  }
}
