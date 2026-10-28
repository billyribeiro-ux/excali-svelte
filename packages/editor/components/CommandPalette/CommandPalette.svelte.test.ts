import { fireEvent, render, screen } from "@testing-library/svelte";
import { flushSync } from "svelte";

import { editorJotaiStore } from "../../editor-jotai";

import { lastUsedPaletteItem } from "./CommandPaletteInner.svelte";
import Harness from "./CommandPalette.harness.test.svelte";

import type { EditorContextValue } from "../../ui/editorContext";
import type { CommandPaletteItem } from "./types";

const { performed, libraryItemsAtom } = vi.hoisted(() => ({
  performed: [] as string[],
  libraryItemsAtom: { current: null as any },
}));

vi.mock("../Dialog.svelte", async () => ({
  default: (await import("./testStubs/DialogStub.svelte")).default,
}));
vi.mock("../TextField.svelte", async () => ({
  default: (await import("./testStubs/TextFieldStub.svelte")).default,
}));
vi.mock("../Ellipsify.svelte", async () => ({
  default: (await import("./testStubs/EllipsifyStub.svelte")).default,
}));
vi.mock("./LibraryItemIcon.svelte", async () => ({
  default: (await import("./testStubs/LibraryItemIconStub.svelte")).default,
}));
vi.mock("../../data/library", async () => {
  const { atom } = await import("../../editor-jotai");
  libraryItemsAtom.current = atom<{ libraryItems: any[] }>({
    libraryItems: [],
  });
  return {
    libraryItemsAtom: libraryItemsAtom.current,
    distributeLibraryItemsOnSquareGrid: (items: any[]) => items,
  };
});
vi.mock("./buildCommands", async () => {
  const { getCategoryOrder } = await import("./categories");
  const make = (
    label: string,
    category: string,
    extra: Partial<CommandPaletteItem> = {},
  ) => ({
    label,
    category,
    order: getCategoryOrder(category),
    haystack: label.toLowerCase(),
    perform: () => {
      performed.push(label);
    },
    ...extra,
  });
  return {
    buildAllCommands: () => [
      make("Alpha", "App", { shortcut: "Ctrl+A" }),
      make("Beta", "App"),
      make("Gamma", "Editor"),
      make("Edit only", "Editor", { viewMode: false }),
    ],
  };
});

type FakeState = {
  openDialog: { name: string } | null;
  viewModeEnabled: boolean;
};

const createContext = (initial: Partial<FakeState> = {}) => {
  const appState: FakeState = $state({
    openDialog: { name: "commandPalette" },
    viewModeEnabled: false,
    ...initial,
  });
  const setAppState = vi.fn((update: any, cb?: () => void) => {
    Object.assign(
      appState,
      typeof update === "function" ? update(appState) : update,
    );
    cb?.();
  });
  const context = {
    app: {
      scene: { getNonDeletedElements: () => [] },
      editorInterface: { formFactor: "desktop" },
      ownerDocument: document,
      ownerWindow: window,
      onInsertElements: vi.fn(),
    },
    props: {},
    get appState() {
      return appState;
    },
    elements: [],
    actionManager: {},
    editorInterface: { formFactor: "desktop" },
    api: null,
    container: null,
    setAppState,
  } as unknown as EditorContextValue;
  return { context, appState, setAppState };
};

const labels = () =>
  [...document.querySelectorAll(".command-item .name")].map((el) =>
    el.textContent?.trim(),
  );

const selected = () =>
  document
    .querySelector(".command-item.item-selected .name")
    ?.textContent?.trim();

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("CommandPalette", () => {
  beforeEach(() => {
    performed.length = 0;
    editorJotaiStore.set(lastUsedPaletteItem, null);
    editorJotaiStore.set(libraryItemsAtom.current, { libraryItems: [] });
  });

  it("renders nothing while the commandPalette dialog is closed", () => {
    const { context } = createContext({ openDialog: null });
    render(Harness, { editor: context });
    expect(document.querySelector(".command-palette-dialog")).toBeNull();
  });

  it("lists commands grouped by category in category order", () => {
    const { context } = createContext();
    render(Harness, { editor: context });
    expect(
      [...document.querySelectorAll(".command-category-title")].map(
        (el) => el.textContent,
      ),
    ).toEqual(["App", "Editor"]);
    expect(labels()).toEqual(["Alpha", "Beta", "Gamma", "Edit only"]);
    expect(selected()).toBe("Alpha");
    expect(document.querySelector(".shortcut-key")).not.toBeNull();
  });

  it("hides view-mode=false commands and disables nothing else in view mode", () => {
    const { context } = createContext({ viewModeEnabled: true });
    render(Harness, { editor: context });
    expect(labels()).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("filters with fuzzy search and shows a no-match state", async () => {
    const { context } = createContext();
    render(Harness, { editor: context });
    const input = screen.getByPlaceholderText(
      "Search menus, commands, and discover hidden gems",
    );
    await fireEvent.input(input, { target: { value: "gam" } });
    expect(labels()).toEqual(["Gamma"]);
    expect(selected()).toBe("Gamma");

    await fireEvent.input(input, { target: { value: "zzzz" } });
    expect(document.querySelector(".no-match")).not.toBeNull();
  });

  it("moves the selection with ArrowDown/ArrowUp and wraps", async () => {
    const { context } = createContext();
    render(Harness, { editor: context });
    await fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(selected()).toBe("Beta");
    await fireEvent.keyDown(window, { key: "ArrowUp" });
    await fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(selected()).toBe("Edit only");
    await fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(selected()).toBe("Alpha");
  });

  it("selects on hover and executes on click: closes, performs, remembers as recent", async () => {
    const { context, appState, setAppState } = createContext();
    render(Harness, { editor: context });
    const item = [...document.querySelectorAll(".command-item")].find((el) =>
      el.textContent?.includes("Beta"),
    )!;
    await fireEvent.mouseMove(item);
    expect(selected()).toBe("Beta");
    await fireEvent.click(item);
    expect(setAppState).toHaveBeenCalledWith(
      { openDialog: null },
      expect.any(Function),
    );
    expect(appState.openDialog).toBeNull();
    expect(performed).toEqual(["Beta"]);
    expect(
      document.body.classList.contains("excalidraw-animations-disabled"),
    ).toBe(true);
  });

  it("executes the current command on Enter and shows it under recents on reopen", async () => {
    const { context, appState } = createContext();
    const { unmount } = render(Harness, { editor: context });
    await fireEvent.keyDown(window, { key: "ArrowDown" });
    await fireEvent.keyDown(window, { key: "Enter" });
    await tick();
    expect(performed).toEqual(["Beta"]);
    unmount();

    appState.openDialog = { name: "commandPalette" };
    render(Harness, { editor: context });
    flushSync();
    expect(
      document.querySelector(".command-category-title")?.textContent,
    ).toContain("Recent");
    expect(selected()).toBe("Beta");
    // the recent command isn't repeated in its own category
    expect(labels().filter((l) => l === "Beta")).toHaveLength(1);
  });

  it("toggles via Ctrl/Cmd+/ and closes via the dialog close request", async () => {
    const { context, appState } = createContext({ openDialog: null });
    render(Harness, { editor: context });
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    await fireEvent.keyDown(window, {
      key: "/",
      ctrlKey: !isMac,
      metaKey: isMac,
    });
    expect(appState.openDialog).toEqual({ name: "commandPalette" });
    flushSync();
    await fireEvent.click(screen.getByTestId("dialog-close"));
    expect(appState.openDialog).toBeNull();
  });

  it("offers named library items when searching and inserts them", async () => {
    const { context } = createContext();
    editorJotaiStore.set(libraryItemsAtom.current, {
      libraryItems: [{ id: "lib1", name: "Sprocket", elements: [] }],
    });
    render(Harness, { editor: context });
    const input = screen.getByPlaceholderText(
      "Search menus, commands, and discover hidden gems",
    );
    await fireEvent.input(input, { target: { value: "sprock" } });
    expect(labels()).toEqual(["Sprocket"]);
    expect(screen.getByTestId("library-item-icon-stub")).toBeTruthy();
    expect(
      document.querySelector(".command-item.command-item-large"),
    ).not.toBeNull();
    await fireEvent.click(document.querySelector(".command-item")!);
    expect((context.app as any).onInsertElements).toHaveBeenCalledWith([
      { id: "lib1", name: "Sprocket", elements: [] },
    ]);
  });
});
