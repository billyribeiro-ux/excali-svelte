import { afterEach, describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../editor-jotai";

import { scrollPositionAtom, trackScrollPosition } from "./scrollPosition";

describe("trackScrollPosition", () => {
  afterEach(() => {
    vi.useRealTimers();
    editorJotaiStore.set(scrollPositionAtom, 0);
  });

  it("publishes scrollTop throttled to 200ms and stops on cleanup", () => {
    vi.useFakeTimers();
    const element = document.createElement("div");
    const cleanup = trackScrollPosition(element) as () => void;

    element.scrollTop = 40;
    element.dispatchEvent(new Event("scroll"));
    // throttle: leading call fires immediately
    expect(editorJotaiStore.peek(scrollPositionAtom)).toBe(40);

    element.scrollTop = 90;
    element.dispatchEvent(new Event("scroll"));
    expect(editorJotaiStore.peek(scrollPositionAtom)).toBe(40);
    vi.advanceTimersByTime(200);
    expect(editorJotaiStore.peek(scrollPositionAtom)).toBe(90);

    cleanup();
    element.scrollTop = 150;
    element.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(500);
    expect(editorJotaiStore.peek(scrollPositionAtom)).toBe(90);
  });
});
