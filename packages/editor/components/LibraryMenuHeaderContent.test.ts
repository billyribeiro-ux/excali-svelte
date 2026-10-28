import { render } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setEditorContext } from "../ui/editorContext";

import LibraryMenuHeaderContent from "./LibraryMenuHeaderContent.svelte";

import type { EditorContextValue } from "../ui/editorContext";

const captured = vi.hoisted(() => ({ props: null as any }));

vi.mock("../data/library", async () => {
  const { atom } = await import("../editor-jotai");
  return {
    libraryItemsAtom: atom({
      status: "loaded",
      isInitialized: true,
      libraryItems: [
        { id: "a", status: "unpublished", created: 0, elements: [] },
        { id: "b", status: "unpublished", created: 0, elements: [] },
      ],
    }),
  };
});
vi.mock("./LibraryDropdownMenuButton.svelte", () => ({
  default: (_anchor: Comment, props: unknown) => {
    captured.props = props;
  },
}));

const library = {
  setLibrary: vi.fn(async () => []),
  resetLibrary: vi.fn(async () => []),
};
const setAppState = vi.fn();

const Wrapper = (...args: Parameters<typeof LibraryMenuHeaderContent>) => {
  setEditorContext({
    app: { library },
    appState: { theme: "light" },
    setAppState,
  } as unknown as EditorContextValue);
  return LibraryMenuHeaderContent(...args);
};

describe("LibraryMenuHeaderContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.props = null;
  });

  it("passes editor state and the selection to the dropdown button", () => {
    render(Wrapper, {
      selectedItems: ["a"],
      onSelectItems: vi.fn(),
      class: "x",
    });
    expect(captured.props.selectedItems).toEqual(["a"]);
    expect(captured.props.library).toBe(library);
    expect(captured.props.appState).toEqual({ theme: "light" });
    expect(captured.props.setAppState).toBe(setAppState);
  });

  it("removes only the selected items and clears the selection", async () => {
    const onSelectItems = vi.fn();
    render(Wrapper, { selectedItems: ["a"], onSelectItems });
    await captured.props.onRemoveFromLibrary();
    expect(library.setLibrary).toHaveBeenCalledTimes(1);
    const next = (library.setLibrary.mock.calls[0] as any[])[0];
    expect(next.map((item: { id: string }) => item.id)).toEqual(["b"]);
    expect(onSelectItems).toHaveBeenCalledWith([]);
  });

  it("reports a failure to remove via errorMessage", async () => {
    library.setLibrary.mockRejectedValueOnce(new Error("nope"));
    render(Wrapper, { selectedItems: ["a"], onSelectItems: vi.fn() });
    await captured.props.onRemoveFromLibrary();
    await vi.waitFor(() =>
      expect(setAppState).toHaveBeenCalledWith({
        errorMessage: expect.any(String),
      }),
    );
  });

  it("resets the library", () => {
    render(Wrapper, { selectedItems: [], onSelectItems: vi.fn() });
    captured.props.resetLibrary();
    expect(library.resetLibrary).toHaveBeenCalledTimes(1);
  });
});
