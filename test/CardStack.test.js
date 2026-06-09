import { describe, it, expect } from "vitest";
import { CardStack, isValidSet, getSetDifficulty } from "../src/util/CardStack";

const card = (element, count, color, level = 1) => ({ element, count, color, level });

// Brute-force: does the deck contain at least one valid 3-card set?
const containsValidSet = (deck) => {
  for (let a = 0; a < deck.length; a++) {
    for (let b = a + 1; b < deck.length; b++) {
      for (let c = b + 1; c < deck.length; c++) {
        if (isValidSet(deck[a], deck[b], deck[c])) {
          return true;
        }
      }
    }
  }
  return false;
};

describe("isValidSet", () => {
  it("accepts a set where one property is all-different and the rest all-equal", () => {
    expect(isValidSet(card(1, 1, 1), card(1, 1, 2), card(1, 1, 3))).toBe(true);
  });

  it("accepts a set where every property is all-equal", () => {
    expect(isValidSet(card(2, 2, 2), card(2, 2, 2), card(2, 2, 2))).toBe(true);
  });

  it("accepts a set where every property is all-different", () => {
    expect(isValidSet(card(1, 1, 1), card(2, 2, 2), card(3, 3, 3))).toBe(true);
  });

  it("rejects a set where a property is two-equal-one-different", () => {
    // color is 1,2,1 -> neither all-equal nor all-different
    expect(isValidSet(card(1, 1, 1), card(1, 1, 2), card(1, 1, 1))).toBe(false);
  });

  it("rejects when levels differ", () => {
    expect(isValidSet(card(1, 1, 1, 1), card(1, 1, 2, 1), card(1, 1, 3, 2))).toBe(false);
  });
});

describe("getSetDifficulty", () => {
  it("is 0 when element, count and color are all-equal", () => {
    expect(getSetDifficulty(card(1, 1, 1), card(1, 1, 1), card(1, 1, 1))).toBe(0);
  });

  it("counts each all-different property (1) up to 3", () => {
    // only color differs
    expect(getSetDifficulty(card(1, 1, 1), card(1, 1, 2), card(1, 1, 3))).toBe(1);
    // count and color differ
    expect(getSetDifficulty(card(1, 1, 1), card(1, 2, 2), card(1, 3, 3))).toBe(2);
    // element, count and color all differ
    expect(getSetDifficulty(card(1, 1, 1), card(2, 2, 2), card(3, 3, 3))).toBe(3);
  });

  it("ignores level", () => {
    expect(getSetDifficulty(card(1, 1, 1, 1), card(1, 1, 1, 2), card(1, 1, 1, 3))).toBe(0);
  });
});

describe("CardStack.getDeck", () => {
  it("returns 12 cards that contain at least one valid set", () => {
    const stack = new CardStack();
    const deck = stack.getDeck();
    expect(deck).toHaveLength(12);
    expect(containsValidSet(deck)).toBe(true);
  });

  it("keeps returning valid decks as the stack is drawn down", () => {
    const stack = new CardStack();
    for (let i = 0; i < 10; i++) {
      const deck = stack.getDeck();
      expect(deck).toHaveLength(12);
      expect(containsValidSet(deck)).toBe(true);
    }
  });
});
