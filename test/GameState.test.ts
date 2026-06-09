import { describe, it, expect, vi } from "vitest";
import { GameState, DIFFICULTY_SCORE_MULTIPLIER } from "../src/util/GameState";
import type { CardData } from "../src/util/entity/Card";

const card = (element: number, count: number, color: number, level = 1): CardData => ({ element, count, color, level });

// A valid set with one all-different property (color) -> difficulty 1.
const validTriple = [card(1, 1, 1), card(1, 1, 2), card(1, 1, 3)];
// A valid set with every property all-different -> difficulty 3.
const validTripleHard = [card(1, 1, 1), card(2, 2, 2), card(3, 3, 3)];
// Not a set: color is 1,2,1 (two-equal-one-different).
const invalidTriple = [card(1, 1, 1), card(1, 1, 2), card(1, 1, 1)];

const selectTriple = (state: GameState, triple: CardData[]) => {
  triple.forEach((data, id) => state.toggleCard({ id, data }));
};

describe("GameState initial state", () => {
  it("starts with the given time, full lives and an empty selection", () => {
    const state = new GameState({ time: 100 });
    expect(state.time).toBe(100);
    expect(state.initialTime).toBe(100);
    expect(state.lives).toBe(5);
    expect(state.score).toBe(0);
    expect(state.newDeck).toBe(true);
    expect(state.lastSelectionSuccess).toBeNull();
    expect(state.getSelectedCards()).toEqual([]);
    expect(state.selectedSets).toEqual([]);
  });
});

describe("toggleCard selection", () => {
  it("selects and deselects a card", () => {
    const state = new GameState({ time: 100 });
    state.toggleCard({ id: 0, data: card(1, 1, 1) });
    expect(state.getSelectedCards()).toHaveLength(1);
    state.toggleCard({ id: 0, data: card(1, 1, 1) });
    expect(state.getSelectedCards()).toHaveLength(0);
  });

  it("exposes selected cards as {id, data}", () => {
    const state = new GameState({ time: 100 });
    state.toggleCard({ id: 7, data: card(2, 3, 1) });
    expect(state.getSelectedCards()).toEqual([{ id: 7, data: card(2, 3, 1) }]);
  });
});

describe("toggleCard on a valid set", () => {
  it("awards difficulty * multiplier points and flags a new deck", () => {
    const state = new GameState({ time: 100 });
    selectTriple(state, validTriple);
    expect(state.lastSelectionSuccess).toBe(true);
    expect(state.score).toBe(1 * DIFFICULTY_SCORE_MULTIPLIER);
    expect(state.newDeck).toBe(true);
    expect(state.lives).toBe(5);
    expect(state.time).toBe(100);
    expect(state.selectedSets).toHaveLength(1);
    expect(state.selectedSets[0]).toHaveLength(3);
  });

  it("scores the hardest sets the highest", () => {
    const state = new GameState({ time: 100 });
    selectTriple(state, validTripleHard);
    expect(state.score).toBe(3 * DIFFICULTY_SCORE_MULTIPLIER);
  });
});

describe("toggleCard on an invalid set", () => {
  it("loses time and a life", () => {
    const state = new GameState({ time: 100 });
    selectTriple(state, invalidTriple);
    expect(state.lastSelectionSuccess).toBe(false);
    expect(state.time).toBe(95);
    expect(state.lives).toBe(4);
    expect(state.score).toBe(0);
  });

  it("never drives time below zero", () => {
    const state = new GameState({ time: 3 });
    selectTriple(state, invalidTriple);
    expect(state.time).toBe(0);
  });

  it("resets lives and deducts points when the last life is lost", () => {
    const state = new GameState({ time: 100 });
    for (let round = 0; round < 5; round++) {
      selectTriple(state, invalidTriple);
      state.resetSelectedCards();
    }
    expect(state.lives).toBe(5);
    expect(state.score).toBe(-20);
  });
});

describe("resetSelectedCards", () => {
  it("clears the selection and the last result", () => {
    const state = new GameState({ time: 100 });
    selectTriple(state, invalidTriple);
    state.resetSelectedCards();
    expect(state.getSelectedCards()).toHaveLength(0);
    expect(state.lastSelectionSuccess).toBeNull();
  });
});

describe("onRefresh", () => {
  it("spends a life to request a new deck", () => {
    const state = new GameState({ time: 100 });
    state.onRefresh();
    expect(state.lives).toBe(4);
    expect(state.newDeck).toBe(true);
  });

  it("does nothing on the last life", () => {
    const state = new GameState({ time: 100 });
    state.lives = 1;
    state.newDeck = false;
    state.onRefresh();
    expect(state.lives).toBe(1);
    expect(state.newDeck).toBe(false);
  });
});

describe("isGameOver", () => {
  it("is true only once time runs out", () => {
    const state = new GameState({ time: 1 });
    expect(state.isGameOver()).toBe(false);
    state.time = 0;
    expect(state.isGameOver()).toBe(true);
    state.time = -3;
    expect(state.isGameOver()).toBe(true);
  });
});

describe("time change listeners", () => {
  it("notifies registered callbacks and supports removeAllListeners", () => {
    const state = new GameState({ time: 100 });
    const cb = vi.fn();
    state.onTimeChange(cb);
    state.emitTimeChange();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(state);
    state.removeAllListeners();
    state.emitTimeChange();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("ignores non-function callbacks", () => {
    const state = new GameState({ time: 100 });
    state.onTimeChange(null);
    expect(() => state.emitTimeChange()).not.toThrow();
  });
});

describe("timer", () => {
  it("decrements time once per second and notifies listeners", () => {
    vi.useFakeTimers();
    try {
      const state = new GameState({ time: 100 });
      const cb = vi.fn();
      state.onTimeChange(cb);
      state.startTimer();
      vi.advanceTimersByTime(3000);
      expect(state.time).toBe(97);
      expect(cb).toHaveBeenCalledTimes(3);
      state.stopTimer();
      vi.advanceTimersByTime(3000);
      expect(state.time).toBe(97);
    } finally {
      vi.useRealTimers();
    }
  });
});
