import { newTextElement, newEmbeddableElement } from "@svelte-draw/element";
import { describe, expect, it } from "vitest";

import { getDefaultAppState } from "../../appState";

import {
  POPUP_WIDTH,
  getContextMenuLabel,
  getCoordsForPopover,
  shouldHideLinkPopup,
} from "./Hyperlink";

const appState = () => ({ ...getDefaultAppState(), offsetLeft: 0, offsetTop: 0 } as any);

describe("getContextMenuLabel", () => {
  it("picks create / edit / editEmbed", () => {
    const text = newTextElement({ text: "a", x: 0, y: 0 });
    const state = (id: string) => ({
      ...appState(),
      selectedElementIds: { [id]: true },
    });
    expect(getContextMenuLabel([text], state(text.id))).toBe(
      "labels.link.create",
    );
    const linked = newTextElement({ text: "a", x: 0, y: 0 });
    (linked as any).link = "https://x.test";
    expect(getContextMenuLabel([linked], state(linked.id))).toBe(
      "labels.link.edit",
    );
    const embed = newEmbeddableElement({ type: "embeddable", x: 0, y: 0, width: 10, height: 10 });
    expect(getContextMenuLabel([embed], state(embed.id))).toBe(
      "labels.link.editEmbed",
    );
  });
});

describe("popup geometry", () => {
  const el = newEmbeddableElement({ type: "embeddable", x: 100, y: 200, width: 100, height: 50 });
  const map = new Map([[el.id, el]]) as any;

  it("centers the popover above the element", () => {
    const { x, y } = getCoordsForPopover(el, appState(), map);
    expect(x).toBe(150 - POPUP_WIDTH / 2);
    expect(y).toBe(200 - 85);
  });

  it("does not hide when hovering the element", () => {
    expect(shouldHideLinkPopup(el, map, appState(), [150, 220] as any)).toBe(
      false,
    );
  });

  it("hides when the pointer is far away", () => {
    expect(shouldHideLinkPopup(el, map, appState(), [2000, 2000] as any)).toBe(
      true,
    );
  });
});
