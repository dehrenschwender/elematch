import {Card} from "./entity/Card";

/**
 * Get all available cards as array.
 *
 * @returns {Card[]}
 */
let generateCardDeck = () => {
    let cards = [];

    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            for (let k = 1; k <= 3; k++) {
                for (let m = 1; m <= 3; m++) {
                    cards.push(new Card({
                        element: i,
                        count: j,
                        color: k,
                        level: m
                    }))
                }
            }
        }
    }

    return cards;
};

/**
 * Returns the card from the given stack that builds a set with the given cards. If the stack doesn't contain such a
 * card, the function returns false.
 *
 * @param card1
 * @param card2
 * @param stack
 * @returns {Card | boolean}
 */
let getLastCardForSet = (card1, card2, stack) => {
    let [matchingElement, matchingCount, matchingColor, matchingLevel] = ["element", "count", "color", "level"].map(property => {
        return stack.filter(elem => {
            return (elem[property] === card1[property] && elem[property] === card2[property])
                || (elem[property] !== card1[property] && elem[property] !== card2[property]);
        })
    });

    let cards = matchingElement.filter(c => {
        return matchingCount.includes(c) && matchingColor.includes(c) && matchingLevel.includes(c);
    });

    return cards.pop() || false
};

/**
 * Get a set of 3 cards from the given stack. If the stack doesn't contain a set, the function returns false.
 *
 * @param stack
 * @returns {boolean|Card[]}
 */
let getSetFromStack = (stack) => {
    let card1 = stack.shift();

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
    constructor() {
        this.cards = generateCardDeck();
    }

    /**
     * Get a shuffled deck of cards that contains at least one set. If it is not possible to create such a deck with the
     * current card stack, the stack is regenerated.
     *
     * @returns {Card[]}
     */
    getDeck() {
        let deck = getSetFromStack(this.cards);

        if (!deck || this.cards.length < 12) {
            console.log("regenerate deck");
            this.cards = generateCardDeck();

            return this.getDeck();
        }

        // remove the set from the stack of available cards
        this.cards = this.cards.filter((card) => {
            return !deck.includes(card);
        });

        while (deck.length < 12) {
            deck.push(this.cards.pop())
        }

        return Phaser.Utils.Array.Shuffle(deck);
    }
}