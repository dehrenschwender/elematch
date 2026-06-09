export interface CardData {
  element: number;
  count: number;
  color: number;
  level: number;
}

/** The subset of a card's data needed to resolve its texture name. */
type TextureSource = Pick<CardData, "element" | "count" | "color">;

const ELEMENT: Record<number, string> = {
  1: "fire",
  2: "water",
  3: "energy"
};

const COLOR: Record<number, string> = {
  1: "red",
  2: "blue",
  3: "yellow"
};

export let getTextureNameForCard = (card: TextureSource, variant = "half"): string => {
  return ELEMENT[card.element] + "-" + COLOR[card.color] + "-" + card.count + "-" + variant;
};

export let getTextureNameForCardObjectLiteral = (card: TextureSource, variant = "half"): string => {
  return ELEMENT[card.element] + "-" + COLOR[card.color] + "-" + card.count + "-" + variant;
};

export class Card implements CardData {
  element: number;
  count: number;
  color: number;
  level: number;

  constructor({ element, count, color, level }: CardData) {
    this.element = element;
    this.count = count;
    this.color = color;
    this.level = level;
  }
}
