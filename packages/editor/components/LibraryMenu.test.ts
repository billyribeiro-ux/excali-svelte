import { fireEvent, render, } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { newElement } from "@svelte-draw/element";

import { editorJotaiStore } from "../editor-jotai";
import { createSignal } from "../ui/signal";
import { setEditorContext } from "../ui/editorContext";

import LibraryMenu from "./LibraryMenu.svelte";

import type { EditorContextValue } from "../ui/editorContext";

const captured = vi.hoisted(() => ({ props: null as any }));

vi.mock("../data/library", async () => {
  const { atom } = await import("../editor-jotai");
  return {
    libraryItemsAtom: atom({
      status: "loaded",
      isInitialized: true,
      libraryItems: [] as any[],
    }),
    distributeLibraryItemsOnSquareGrid: (items: any[]) =>
      items.flatMap((item) => item.elements),
  };
});
vi.mock("./LibraryMenuItems.svelte", () => ({
  default: (_anchor: Comment, props: unknown) => {
    captured.props = props;
  },
}));

const { libraryItemsAtom } = await import("../data/library");

const rect = (id: string, version = 1) => ({
  ...newElement({ type: "rectangle", x: 0, y: 0 }),
  id,
  version,
});

const setup = () => {
  const el1 = rect("el1");
  const el2 = rect("el2");
  const state = createSignal<any>({
    theme: "light",
    cursorButton: "up",
    activeTool: { type: "selection" },
    selectedElementIds: {},
  });
  const elements = createSignal<any[]>([el1, el2]);
  const library = { setLibrary: vi.fn(async () => []) };
  const setAppState = vi.fn();
  const app = {
    id: "app-id",
    library,
    ownerDocument: document,
    ownerWindow: window,
    focusContainer: vi.fn(),
    onInsertElements: vi.fn(),
    viewport: { lastPosition: { x: 0, y: 0 } },
    scene: {
      getNonDeletedElementsMap: () =>
        new Map(elements.peek().map((element) => [element.id, element])),
    },
  };
  const Wrapper = (...args: Parameters<typeof LibraryMenu>) => {
    setEditorContext({
      app,
      props: { libraryReturnUrl: "https://return" },
      get appState() {
        return state.get();
      },
      get elements() {
        return elements.get();
      },
      setAppState,
    } as unknown as EditorContextValue);
    return LibraryMenu(...args);
  };
  return { Wrapper, state, elements, library, setAppState, app, el1, el2 };
};

describe("LibraryMenu", () => {
  beforeEach(() => {
    captured.props = null;
    editorJotaiStore.set(libraryItemsAtom as any, {
      status: "loaded",
      isInitialized: true,
      libraryItems: [],
    });
  });

  it("shows a loading message until the library is initialized", () => {
    editorJotaiStore.set(libraryItemsAtom as any, {
      status: "loading",
      isInitialized: false,
      libraryItems: [],
    });
    const { container } = render(setup().Wrapper);
    expect(container.querySelector(".layer-ui__library-message")).not.toBeNull();
    expect(captured.props).toBeNull();
  });

  it("renders the items with editor-derived props and no bottom button for an empty library", () => {
    const { container } = render(setup().Wrapper);
    expect(container.querySelector(".layer-ui__library")).not.toBeNull();
    expect(captured.props.id).toBe("app-id");
    expect(captured.props.libraryReturnUrl).toBe("https://return");
    expect(captured.props.theme).toBe("light");
    expect(captured.props.pendingElements).toEqual([]);
    expect(
      container.querySelector(".library-menu-control-buttons--at-bottom"),
    ).toBeNull();
  });

  it("shows the bottom browse button once the library has items", () => {
    editorJotaiStore.set(libraryItemsAtom as any, {
      status: "loaded",
      isInitialized: true,
      libraryItems: [{ id: "x", status: "unpublished", created: 0, elements: [] }],
    });
    const { container } = render(setup().Wrapper);
    expect(
      container.querySelector(".library-menu-control-buttons--at-bottom"),
    ).not.toBeNull();
  });

  it("derives pending elements from the selection once the pointer is released", async () => {
    const { Wrapper, state, el1, el2 } = setup();
    render(Wrapper);
    expect(captured.props.pendingElements).toEqual([]);

    state.set({
      ...state.peek(),
      cursorButton: "down",
      selectedElementIds: { el1: true },
    });
    await Promise.resolve();
    // pointer still down -> not updated yet
    expect(captured.props.pendingElements).toEqual([]);

    state.set({ ...state.peek(), cursorButton: "up" });
    await vi.waitFor(() =>
      expect(captured.props.pendingElements.map((e: any) => e.id)).toEqual([
        el1.id,
      ]),
    );

    state.set({
      ...state.peek(),
      selectedElementIds: { el1: true, el2: true },
    });
    await vi.waitFor(() =>
      expect(captured.props.pendingElements.map((e: any) => e.id)).toEqual([
        el1.id,
        el2.id,
      ]),
    );
  });

  it("adds pending elements to the front of the library and deselects them", async () => {
    const { Wrapper, library, setAppState, el1 } = setup();
    editorJotaiStore.set(libraryItemsAtom as any, {
      status: "loaded",
      isInitialized: true,
      libraryItems: [{ id: "old", status: "unpublished", created: 0, elements: [] }],
    });
    render(Wrapper);
    captured.props.onAddToLibrary([el1]);
    expect(setAppState).toHaveBeenCalledWith({
      selectedElementIds: {},
      selectedGroupIds: {},
      activeEmbeddable: null,
    });
    expect(library.setLibrary).toHaveBeenCalledTimes(1);
    const next = (library.setLibrary.mock.calls[0] as any[])[0];
    expect(next).toHaveLength(2);
    expect(next[0]).toMatchObject({ status: "unpublished", elements: [el1] });
    expect(next[1].id).toBe("old");
  });

  it("refuses to add element types that can't live in the library", () => {
    const { Wrapper, library, setAppState } = setup();
    render(Wrapper);
    const image = { ...newElement({ type: "rectangle", x: 0, y: 0 }), type: "image" };
    captured.props.onAddToLibrary([image]);
    expect(library.setLibrary).not.toHaveBeenCalled();
    expect(setAppState).toHaveBeenCalledWith({
      errorMessage: expect.any(String),
    });
  });

  it("inserts library items on the canvas and refocuses it", () => {
    const { Wrapper, app, el1 } = setup();
    render(Wrapper);
    captured.props.onInsertLibraryItems([{ id: "i", elements: [el1] }]);
    expect(app.onInsertElements).toHaveBeenCalledWith([el1]);
    expect(app.focusContainer).toHaveBeenCalled();
  });

  it("Escape inside the sidebar clears the library selection first, then closes the sidebar from an empty search", async () => {
    const { Wrapper, setAppState, app } = setup();
    const sidebar = document.createElement("div");
    sidebar.className = "sidebar";
    const input = document.createElement("input");
    sidebar.appendChild(input);
    document.body.appendChild(sidebar);

    render(Wrapper);
    captured.props.onSelectItems(["a"]);
    await vi.waitFor(() => expect(captured.props.selectedItems).toEqual(["a"]));

    await fireEvent.keyDown(input, { key: "Escape" });
    await vi.waitFor(() => expect(captured.props.selectedItems).toEqual([]));
    expect(setAppState).not.toHaveBeenCalledWith({ openSidebar: null });

    await fireEvent.keyDown(input, { key: "Escape" });
    expect(setAppState).toHaveBeenCalledWith({ openSidebar: null });
    expect(app.focusContainer).toHaveBeenCalled();
    sidebar.remove();
  });
});
