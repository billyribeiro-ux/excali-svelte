import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { newElement } from "@svelte-draw/element";

import { libraryItemsAtom } from "../data/library";
import { editorJotaiStore } from "../editor-jotai";
import { setEditorContext } from "../ui/editorContext";

import LibraryDropdownMenuButton from "./LibraryDropdownMenuButton.svelte";
import { isLibraryMenuOpenAtom } from "./LibraryMenu";

import type { EditorContextValue } from "../ui/editorContext";
import type { LibraryItem } from "../types";

// data/library.ts still imports the removed React hook module; the real atom
// shape is `{ status, isInitialized, libraryItems }`
vi.mock("../data/library", async () => {
  const { atom } = await import("../editor-jotai");
  return {
    libraryItemsAtom: atom({
      status: "loaded",
      isInitialized: false,
      libraryItems: [],
    }),
  };
});
// bits-ui (behind the real DropdownMenu) can't be loaded by vitest yet, use a
// minimal stand-in with the same part names
vi.mock("./dropdownMenu/DropdownMenu", async () => {
  const [Root, Trigger, Content, Item] = await Promise.all([
    import("./dropdownMenuStub/Root.svelte"),
    import("./dropdownMenuStub/Trigger.svelte"),
    import("./dropdownMenuStub/Content.svelte"),
    import("./dropdownMenuStub/Item.svelte"),
  ]);
  return {
    default: Object.assign(Root.default, {
      Trigger: Trigger.default,
      Content: Content.default,
      Item: Item.default,
    }),
  };
});
vi.mock("./Dialog.svelte", () => ({
  default: ($$anchor: Comment, props: { children?: (a: Comment) => void }) =>
    props.children?.($$anchor),
}));
vi.mock("./PublishLibrary.svelte", () => ({
  default: ($$anchor: Comment) => {
    const el = document.createElement("div");
    el.setAttribute("data-testid", "publish-library-stub");
    ($$anchor as Comment).parentNode?.insertBefore(el, $$anchor);
  },
}));

const Wrapper = (...args: Parameters<typeof LibraryDropdownMenuButton>) => {
  setEditorContext({
    editorInterface: { formFactor: "desktop" },
    setAppState: vi.fn(),
    container: null,
  } as unknown as EditorContextValue);
  return LibraryDropdownMenuButton(...args);
};

const makeItem = (id: string): LibraryItem => ({
  id,
  status: "unpublished",
  created: 0,
  elements: [newElement({ type: "rectangle", x: 0, y: 0 })],
});

const setLibraryItems = (libraryItems: LibraryItem[]) =>
  editorJotaiStore.set(libraryItemsAtom, {
    status: "loaded",
    isInitialized: true,
    libraryItems,
  });

const baseProps = () => ({
  setAppState: vi.fn(),
  selectedItems: [] as string[],
  library: {
    setLibrary: vi.fn(async () => []),
    updateLibrary: vi.fn(async () => []),
    getLatestLibrary: vi.fn(async () => []),
  } as any,
  onRemoveFromLibrary: vi.fn(),
  resetLibrary: vi.fn(),
  onSelectItems: vi.fn(),
  appState: {} as any,
});

describe("LibraryDropdownMenuButton", () => {
  beforeEach(() => {
    setLibraryItems([makeItem("a"), makeItem("b")]);
    editorJotaiStore.set(isLibraryMenuOpenAtom, false);
    // "Publish library" is only offered when a backend is configured
    vi.stubEnv("VITE_APP_LIBRARY_BACKEND", "https://library-backend.example.test");
  });
  afterEach(() => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, false);
    vi.unstubAllEnvs();
  });

  it("hides 'Publish library' when VITE_APP_LIBRARY_BACKEND is unset", async () => {
    vi.stubEnv("VITE_APP_LIBRARY_BACKEND", "");
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    render(Wrapper, { ...baseProps(), selectedItems: ["a"] });
    await waitFor(() =>
      expect(screen.getByText("Remove")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("lib-dropdown--remove")).toBeNull();
  });

  it("toggles the menu through the trigger", async () => {
    render(Wrapper, baseProps());
    expect(editorJotaiStore.peek(isLibraryMenuOpenAtom)).toBe(false);
    await fireEvent.click(screen.getByTestId("dropdown-menu-button"));
    expect(editorJotaiStore.peek(isLibraryMenuOpenAtom)).toBe(true);
    await waitFor(() =>
      expect(screen.getByTestId("lib-dropdown--load")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("lib-dropdown--export")).toBeInTheDocument();
    expect(screen.queryByTestId("lib-dropdown--remove")).toBeNull();
    expect(screen.getByText("Reset library")).toBeInTheDocument();
  });

  it("with a selection offers publish and remove instead of load/reset, and shows the counter", async () => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    const { container } = render(Wrapper, {
      ...baseProps(),
      selectedItems: ["a"],
    });
    await waitFor(() =>
      expect(screen.getByTestId("lib-dropdown--remove")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("lib-dropdown--load")).toBeNull();
    expect(screen.getByText("Remove")).toBeInTheDocument();
    expect(container.querySelector(".library-actions-counter")).toHaveTextContent(
      "1",
    );
  });

  it("hides export/reset for an empty library", async () => {
    setLibraryItems([]);
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    render(Wrapper, baseProps());
    await waitFor(() =>
      expect(screen.getByTestId("lib-dropdown--load")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("lib-dropdown--export")).toBeNull();
    expect(screen.queryByText("Reset library")).toBeNull();
  });

  it("resets the library after confirming, and closes the menu", async () => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    const props = baseProps();
    render(Wrapper, props);
    await fireEvent.click(await screen.findByText("Reset library"));
    expect(editorJotaiStore.peek(isLibraryMenuOpenAtom)).toBe(false);
    expect(props.resetLibrary).not.toHaveBeenCalled();
    await fireEvent.click(await screen.findByLabelText("Confirm"));
    expect(props.resetLibrary).toHaveBeenCalledTimes(1);
    expect(props.onRemoveFromLibrary).not.toHaveBeenCalled();
  });

  it("removes only the selected items after confirming", async () => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    const props = { ...baseProps(), selectedItems: ["a"] };
    render(Wrapper, props);
    await fireEvent.click(await screen.findByText("Remove"));
    await fireEvent.click(await screen.findByLabelText("Confirm"));
    expect(props.onRemoveFromLibrary).toHaveBeenCalledTimes(1);
    expect(props.resetLibrary).not.toHaveBeenCalled();
  });

  it("does not remove when the confirmation is cancelled", async () => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    const props = baseProps();
    render(Wrapper, props);
    await fireEvent.click(await screen.findByText("Reset library"));
    await fireEvent.click(await screen.findByLabelText("Cancel"));
    expect(props.resetLibrary).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByLabelText("Confirm")).toBeNull());
  });

  it("opens the publish dialog for the selected items", async () => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    render(Wrapper, { ...baseProps(), selectedItems: ["a"] });
    await fireEvent.click(await screen.findByTestId("lib-dropdown--remove"));
    expect(await screen.findByTestId("publish-library-stub")).toBeInTheDocument();
  });
});
