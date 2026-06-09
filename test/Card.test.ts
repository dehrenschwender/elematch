import { describe, it, expect } from "vitest";
import { Card, getTextureNameForCard, getTextureNameForCardObjectLiteral } from "../src/util/entity/Card";

describe("Card", () => {
  it("stores element, count, color and level", () => {
    const card = new Card({ element: 1, count: 2, color: 3, level: 1 });
    expect(card.element).toBe(1);
    expect(card.count).toBe(2);
    expect(card.color).toBe(3);
    expect(card.level).toBe(1);
  });
});

describe("getTextureNameForCard", () => {
  it("maps element/color ids to names and defaults to the half variant", () => {
    // element 1 -> fire, color 1 -> red
    expect(getTextureNameForCard({ element: 1, color: 1, count: 1 })).toBe("fire-red-1-half");
  });

  it("maps every element id", () => {
    expect(getTextureNameForCard({ element: 1, color: 2, count: 1 }, "full")).toBe("fire-blue-1-full");
    expect(getTextureNameForCard({ element: 2, color: 2, count: 1 }, "full")).toBe("water-blue-1-full");
    expect(getTextureNameForCard({ element: 3, color: 2, count: 1 }, "full")).toBe("energy-blue-1-full");
  });

  it("maps every color id", () => {
    expect(getTextureNameForCard({ element: 1, color: 1, count: 2 }, "full")).toBe("fire-red-2-full");
    expect(getTextureNameForCard({ element: 1, color: 2, count: 2 }, "full")).toBe("fire-blue-2-full");
    expect(getTextureNameForCard({ element: 1, color: 3, count: 2 }, "full")).toBe("fire-yellow-2-full");
  });

  it("uses the requested variant", () => {
    expect(getTextureNameForCard({ element: 2, color: 3, count: 3 }, "full")).toBe("water-yellow-3-full");
  });

  it("matches the object-literal variant helper", () => {
    const card = { element: 3, color: 1, count: 2 };
    expect(getTextureNameForCardObjectLiteral(card, "full")).toBe(getTextureNameForCard(card, "full"));
  });
});
