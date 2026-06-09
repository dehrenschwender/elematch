import { getSetDifficulty, isValidSet } from "./CardStack";
import type { CardData } from "./entity/Card";

export const DIFFICULTY_SCORE_MULTIPLIER = 10;
const TIME_LOSS_PER_FAILURE = 5;
const LIVES = 5;
const POINT_LOSS_ON_MISSING_LIVES = 20;

export interface SelectedCard {
    id: number;
    data: CardData;
}

type TimeChangeListener = (state: GameState) => void;

export class GameState {
    initialTime: number;
    time: number;
    lives: number;
    clickedCards: Map<number, CardData>;
    newDeck: boolean;
    score: number;
    lastSelectionSuccess: boolean | null;
    onTimeChangeCallbacks: (TimeChangeListener | null)[];
    selectedSets: SelectedCard[][];
    timerHandle?: ReturnType<typeof setInterval>;

    constructor({ time }: { time: number }) {
        this.initialTime = time;
        this.time = time;
        this.lives = LIVES;
        this.clickedCards = new Map();
        this.newDeck = true;
        this.score = 0;
        this.lastSelectionSuccess = null;
        this.onTimeChangeCallbacks = []
        this.selectedSets = []
    }

    onTimeChange (callBack: TimeChangeListener | null) {
        this.onTimeChangeCallbacks.push(callBack)
    }

    emitTimeChange () {
        this.onTimeChangeCallbacks.forEach((callback) => {
            if (typeof callback !== 'function') {
                return
            }
            callback(this)
        })
    }

    removeAllListeners () {
        this.onTimeChangeCallbacks = []
    }

    startTimer() {
        this.timerHandle = setInterval(() => {
            this.time--;
            this.emitTimeChange()
        }, 1000);
    }

    stopTimer() {
        if (this.timerHandle) {
            clearInterval(this.timerHandle);
        }
    }

    getSelectedCards(): SelectedCard[] {
        return Array.from(this.clickedCards).map(([id, card]) => {
            return { id: id, data: card };
        });
    }

    isGameOver() {
        return this.time <= 0;
    }

    resetSelectedCards() {
        this.clickedCards.clear()
        this.lastSelectionSuccess = null
    }

    onRefresh() {
        if (this.lives > 1) {
            this.lives--;
            this.newDeck = true;
            this.resetSelectedCards()
        }
    }

    toggleCard({ id, data }: SelectedCard) {
        if (this.clickedCards.has(id)) {
            this.clickedCards.delete(id);
        } else {
            this.clickedCards.set(id, data);

            if (this.clickedCards.size === 3) {

                let cards = Array.from(this.clickedCards).map(([, data]) => {
                   return data;
                });

                if (isValidSet(cards[0], cards[1], cards[2])) {
                    this.lastSelectionSuccess = true;
                    this.score += getSetDifficulty(cards[0], cards[1], cards[2]) * DIFFICULTY_SCORE_MULTIPLIER;
                    this.newDeck = true;
                    const selectedSet = [...this.getSelectedCards()]
                    this.selectedSets.push(selectedSet)
                } else {
                    this.lastSelectionSuccess = false;
                    this.time -= TIME_LOSS_PER_FAILURE;
                    this.time = Math.max(this.time, 0)
                    this.lives -= 1;

                    if (this.lives === 0) {
                        this.lives = LIVES;
                        this.score -= POINT_LOSS_ON_MISSING_LIVES;
                    }
                    this.emitTimeChange()
                }
            }
        }
    }
}
