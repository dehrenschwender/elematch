import { BaseScene } from './BaseScene'
import { getTextureNameForCardObjectLiteral, type CardData } from '../util/entity/Card'
import { getSetDifficulty } from '../util/CardStack'
import { DIFFICULTY_SCORE_MULTIPLIER } from '../util/GameState'
import type { GameState, SelectedCard } from '../util/GameState'
import { TEXT_Y } from './ScoreOverlay'

const X_VALUES = [130, 310, 490]
const X_COORD = 1135
const FONT_SIZE = 64
const TEXT_COLOR = '#FFFFFF'

export class LastMatch extends BaseScene {
  lastSetLength: number;

  constructor (props?: Phaser.Types.Scenes.SettingsConfig) {
    super({
      key: 'LastMatch',
      ...props
    })
    this.lastSetLength = 0
  }

  create () {
    this.subscribeToGameStateChange()
  }

  subscribeToGameStateChange () {
    this.scene.get('Game').events.on('changedata', this.onGameStateChange.bind(this))
  }

  onGameStateChange (gameState: GameState) {
    const sets = Array.from(gameState.selectedSets)
    if (sets.length !== this.lastSetLength) {
      this.lastSetLength = sets.length
      this.recreateGameObjects(sets.pop())
    }
  }

  recreateGameObjects (set?: SelectedCard[]) {
    if (!set || set.length !== 3) {
      return
    }
    const cardsData = set.map(entry => entry.data)
    this.children.removeAll()
    this.createCards(cardsData)
    this.createScoreText(cardsData)
  }

  createCards (cardsData: CardData[]) {
    cardsData = [...cardsData].sort(((data1, data2) => data1.count - data2.count))
    const cardImageNames = cardsData.map((data) => getTextureNameForCardObjectLiteral(data))

    cardImageNames.forEach((imageName, index) => {
      const image = new Phaser.GameObjects.Image(
        this,
        X_COORD,
        X_VALUES[index],
        imageName
      )
      this.children.add(image)
    })
  }

  createScoreText (cardsData: CardData[]) {
    const score = getSetDifficulty(cardsData[0], cardsData[1], cardsData[2]) * DIFFICULTY_SCORE_MULTIPLIER
    const textWidth = 250
    console.log(`score is ${score}`)
    const text = new Phaser.GameObjects.Text(
      this,
      X_COORD - textWidth / 2,
      TEXT_Y,
      `+${score}`,
      {
        font: `${FONT_SIZE}px DisposableDroid`,
        color: TEXT_COLOR,
        align: 'center',
        fixedWidth: textWidth
      }
    )
    this.children.add(text)
  }
}
