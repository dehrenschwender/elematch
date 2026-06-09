import { Card, type CardData } from "./entity/Card";

/**
 * Get all available cards as array.
 */
let generateCardDeck = (): Card[] => {
    let cards: Card[] = [];

    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            for (let k = 1; k <= 3; k++) {
                cards.push(new Card({
                    element: i,
                    count: j,
                    color: k,
                    level: 1
                }))
            }
        }
    }

    return Phaser.Utils.Array.Shuffle(cards);
};

/**
 * Returns the card from the given stack that builds a set with the given cards. If the stack doesn't contain such a
 * card, the function returns false.
 */
let getLastCardForSet = (card1: Card, card2: Card, stack: Card[]): Card | false => {
  let cards = stack.filter(elem => {
      return isValidSet(card1, card2, elem);
  });

  return cards.pop() || false;
};

/**
 * Checks if the given cards are a valid set.
 */
export let isValidSet = (card1: CardData, card2: CardData, card3: CardData): boolean => {
  let [matchingElement, matchingCount, matchingColor, matchingLevel] = (["element", "count", "color", "level"] as const).map(property => {
      return (card1[property] === card2[property] && card1[property] === card3[property])
          || (card1[property] !== card2[property] && card1[property] !== card3[property] && card2[property] !== card3[property]);
  });

  return matchingElement && matchingCount && matchingColor && matchingLevel;
};

/**
 * Calculates the difficulty of the given set. Each property with 3 different values increases the difficulty by one up
 * to a maximum of 3
 */
export let getSetDifficulty = (card1: CardData, card2: CardData, card3: CardData): number => {
    return (["element", "count", "color"] as const).map((property): number => {
        return card1[property] === card2[property] && card1[property] === card3[property] ? 0 : 1;
    }).reduce((previous, current) => {
        return previous + current;
    }, 0);
};

/**
 * Get a set of 3 cards from the given stack. If the stack doesn't contain a set, the function returns false.
 */
let getSetFromStack = (stack: Card[]): Card[] | false => {
    let card1 = stack.shift();

    if (!card1) {
        return false;
    }

    for (let i = 0; i < stack.length; i++) {
        let card2 = stack[i];
        let card3 = getLastCardForSet(card1, card2, stack);

        if (card3) {
            return [card1, card2, card3]
        }
    }

    return false;
};

/**
 * Represents a stack of cards
 */
export class CardStack {
    cards: Card[];

    constructor() {
        this.cards = generateCardDeck();
    }

    /**
     * Get a shuffled deck of cards that contains at least one set. If it is not possible to create such a deck with the
     * current card stack, the stack is regenerated.
     */
    getDeck(): Card[] {
        let deck = getSetFromStack(this.cards);

        if (!deck || this.cards.length < 12) {
            this.cards = generateCardDeck();

            return this.getDeck();
        }

        // remove the set from the stack of available cards
        this.cards = this.cards.filter((card) => {
            return !deck.includes(card);
        });

        while (deck.length < 12) {
            // The `this.cards.length < 12` guard above guarantees enough cards remain
            // after removing the 3-card set, so pop() never yields undefined here.
            deck.push(this.cards.pop()!)
        }

        return Phaser.Utils.Array.Shuffle(deck);
    }
}
