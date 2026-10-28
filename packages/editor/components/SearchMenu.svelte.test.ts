import { newTextElement } from "@svelte-draw/element";
import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDefaultAppState } from "../appState";
import { editorJotaiStore } from "../editor-jotai";

import Harness from "./SearchMenuHarness.test.svelte";
import { searchItemInFocusAtom, searchQueryAtom } from "./SearchMenu";

const makeCtx = (elements: any[]) => {
  const setAppState = vi.fn();
  const app = {
    scene: {
      getNonDeletedElements: () => elements,
      getNonDeletedElementsMap: () => new Map(elements.map((e) => [e.id, e])),
      getSceneNonce: () => 1,
    },
    renderEnvironment: undefined,
    state: { ...getDefaultAppState(), openDialog: null, openPopup: null },
    visibleElements: elements,
    ownerWindow: window,
    canvas: { width: 1000, height: 1000 },
    viewport: { getOffsets: () => ({}), setViewport: vi.fn() },
  };
  return {
    ctx: {
      app,
      props: {},
      appState: app.state,
      elements,
      setAppState,
    } as any,
    setAppState,
    app,
  };
};

describe("SearchMenu", () => {
  beforeEach(() => {
    editorJotaiStore.set(searchQueryAtom, "");
    editorJotaiStore.set(searchItemInFocusAtom, null);
  });
  afterEach(() => vi.useRealTimers());

  it("searches on input, lists matches and focuses the first visible one", async () => {
    const el = newTextElement({ text: "hello world hello", x: 0, y: 0 });
    const { ctx, setAppState } = makeCtx([el]);
    const { container } = render(Harness, { ctx });
    const input = container.querySelector("input")!;
    await fireEvent.input(input, { target: { value: "hello" } });

    await waitFor(() =>
      expect(container.querySelectorAll(".layer-ui__result-item")).toHaveLength(
        2,
      ),
    );
    expect(screen.getByText("Texts")).toBeInTheDocument();
    expect(container.querySelector(".layer-ui__result-item b")).toHaveTextContent(
      "hello",
    );
    expect(editorJotaiStore.peek(searchItemInFocusAtom)).toBe(0);
    expect(setAppState).toHaveBeenCalledWith({
      searchMatches: expect.objectContaining({
        matches: expect.arrayContaining([
          expect.objectContaining({ id: el.id }),
        ]),
      }),
    });
  });

  it("navigates matches with Enter and ArrowUp and wraps around", async () => {
    const el = newTextElement({ text: "ab ab ab", x: 0, y: 0 });
    const { ctx } = makeCtx([el]);
    const { container } = render(Harness, { ctx });
    const input = container.querySelector("input")!;
    await fireEvent.input(input, { target: { value: "ab" } });
    await waitFor(() =>
      expect(container.querySelectorAll(".layer-ui__result-item")).toHaveLength(
        3,
      ),
    );
    input.focus();
    await fireEvent.keyDown(input, { key: "Enter" });
    expect(editorJotaiStore.peek(searchItemInFocusAtom)).toBe(1);
    await fireEvent.keyDown(input, { key: "ArrowUp" });
    await fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(editorJotaiStore.peek(searchItemInFocusAtom)).toBe(2);
    expect(
      container.querySelectorAll(".layer-ui__result-item.active"),
    ).toHaveLength(1);
  });

  it("clicking a result focuses it", async () => {
    const el = newTextElement({ text: "ab ab", x: 0, y: 0 });
    const { ctx } = makeCtx([el]);
    const { container } = render(Harness, { ctx });
    await fireEvent.input(container.querySelector("input")!, {
      target: { value: "ab" },
    });
    await waitFor(() =>
      expect(container.querySelectorAll(".layer-ui__result-item")).toHaveLength(
        2,
      ),
    );
    await fireEvent.click(container.querySelectorAll(".layer-ui__result-item")[1]);
    expect(editorJotaiStore.peek(searchItemInFocusAtom)).toBe(1);
  });

  it("shows the no-match message and clears app state on unmount", async () => {
    const el = newTextElement({ text: "abc", x: 0, y: 0 });
    const { ctx, setAppState } = makeCtx([el]);
    const { container, unmount } = render(Harness, { ctx });
    await fireEvent.input(container.querySelector("input")!, {
      target: { value: "zzz" },
    });
    await waitFor(() =>
      expect(screen.getByText("No matches found...")).toBeInTheDocument(),
    );
    unmount();
    expect(setAppState).toHaveBeenLastCalledWith({ searchMatches: null });
    expect(editorJotaiStore.peek(searchItemInFocusAtom)).toBeNull();
  });
});
