import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { newElement } from "@svelte-draw/element";

import { setEditorContext } from "../ui/editorContext";

import LibraryMenuItems from "./LibraryMenuItems.svelte";

import type { EditorContextValue } from "../ui/editorContext";
import type { LibraryItem } from "../types";

vi.mock("./Tooltip", () => ({ showTooltip: vi.fn(), hideTooltip: vi.fn() }));
vi.mock("../scene/export", () => ({
  exportScene: vi.fn(async () =>
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  ),
}));
// the header dropdown has its own dependencies (library data, dialogs)
vi.mock("./LibraryMenuHeaderContent.svelte", () => ({ default: () => {} }));

const Wrapper = (...args: Parameters<typeof LibraryMenuItems>) => {
  setEditorContext({
    editorInterface: { formFactor: "desktop" },
  } as unknown as EditorContextValue);
  return LibraryMenuItems(...args);
};

const makeItem = (
  id: string,
  name: string | undefined,
  status: LibraryItem["status"] = "unpublished",
): LibraryItem => ({
  id,
  name,
  status,
  created: 0,
  elements: [newElement({ type: "rectangle", x: 0, y: 0 })],
});

const baseProps = () => ({
  isLoading: false,
  libraryItems: [] as LibraryItem[],
  pendingElements: [] as LibraryItem["elements"],
  onInsertLibraryItems: vi.fn(),
  onAddToLibrary: vi.fn(),
  libraryReturnUrl: undefined,
  theme: "light" as const,
  id: "app-id",
  selectedItems: [] as string[],
  onSelectItems: vi.fn(),
});

const renderedUnits = (container: HTMLElement) =>
  container.querySelectorAll(".library-unit__active");

describe("LibraryMenuItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_APP_LIBRARY_URL", "https://libraries.example.test");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("shows the empty state with browse button and no search field", () => {
    const { container } = render(Wrapper, baseProps());
    expect(
      container.querySelector(".library-menu-items-container__search"),
    ).toBeNull();
    expect(
      container.querySelector(".library-menu-items__no-items__label"),
    ).not.toBeNull();
    expect(container.querySelector(".library-menu-browse-button")).not.toBeNull();
    expect(
      container
        .querySelector(".library-menu-items-container")!
        .getAttribute("style"),
    ).toMatch(/^border-bottom: 0(px)?;?$/);
  });

  it("renders personal and published sections", async () => {
    const props = {
      ...baseProps(),
      libraryItems: [
        makeItem("a", "alpha"),
        makeItem("b", "beta", "published"),
      ],
    };
    const { container } = render(Wrapper, props);
    const headers = [
      ...container.querySelectorAll(".library-menu-items-container__header"),
    ].map((el) => el.textContent?.trim());
    expect(headers).toEqual(["Personal Library", "svelte-draw Library"]);
    await waitFor(() => expect(renderedUnits(container).length).toBe(2));
    // no browse button when the library is not empty
    expect(container.querySelector(".library-menu-browse-button")).toBeNull();
  });

  it("filters by name (diacritics-insensitive) with the search field and clears on Escape", async () => {
    const props = {
      ...baseProps(),
      libraryItems: [makeItem("a", "Café"), makeItem("b", "door")],
    };
    const { container } = render(Wrapper, props);
    const input = container.querySelector<HTMLInputElement>(
      ".library-menu-items-container__search input",
    )!;
    expect(input).not.toBeNull();

    await fireEvent.input(input, { target: { value: "cafe" } });
    await waitFor(() => expect(renderedUnits(container).length).toBe(1));
    expect(container.querySelector(".library-unit__name")).toHaveTextContent(
      "Café",
    );
    expect(
      container.querySelector(".library-menu-items-container__grid--named"),
    ).not.toBeNull();

    await fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => expect(input.value).toBe(""));
    expect(container.querySelector(".library-unit__name")).toBeNull();
  });

  it("shows a no-results message with a clear button", async () => {
    const props = { ...baseProps(), libraryItems: [makeItem("a", "alpha")] };
    const { container } = render(Wrapper, props);
    const input = container.querySelector<HTMLInputElement>(
      ".library-menu-items-container__search input",
    )!;
    await fireEvent.input(input, { target: { value: "zzz" } });
    expect(
      container.querySelector(".library-menu-items__no-items__hint"),
    ).toHaveTextContent("No matching items found...");
    await fireEvent.click(screen.getByRole("button", { name: /clear search/i }));
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("selects items with the unit checkbox and supports shift range selection", async () => {
    const items = ["a", "b", "c"].map((id) => makeItem(id, id));
    const onSelectItems = vi.fn();
    const { container, rerender } = render(Wrapper, {
      ...baseProps(),
      libraryItems: items,
      onSelectItems,
    });
    await waitFor(() => expect(renderedUnits(container).length).toBe(3));
    const draggers = () =>
      container.querySelectorAll(".library-unit__dragger");

    await fireEvent.click(draggers()[0], { shiftKey: true });
    expect(onSelectItems).toHaveBeenLastCalledWith(["a"]);
    await rerender({ selectedItems: ["a"] });

    await fireEvent.click(draggers()[2], { shiftKey: true });
    expect(onSelectItems).toHaveBeenLastCalledWith(["a", "b", "c"]);
  });

  it("clicking the pending item adds the pending elements to the library", async () => {
    const pendingElements = [newElement({ type: "rectangle", x: 0, y: 0 })];
    const onAddToLibrary = vi.fn();
    const { container } = render(Wrapper, {
      ...baseProps(),
      pendingElements,
      onAddToLibrary,
    });
    await waitFor(() =>
      expect(container.querySelector(".library-unit__adder")).not.toBeNull(),
    );
    await fireEvent.click(container.querySelector(".library-unit__dragger")!);
    expect(onAddToLibrary).toHaveBeenCalledWith(pendingElements);
  });

  it("clicking a library item inserts duplicated elements with fresh ids", async () => {
    const item = makeItem("a", "alpha");
    const onInsertLibraryItems = vi.fn();
    const { container } = render(Wrapper, {
      ...baseProps(),
      libraryItems: [item],
      onInsertLibraryItems,
    });
    await waitFor(() => expect(renderedUnits(container).length).toBe(1));
    await fireEvent.click(container.querySelector(".library-unit__dragger")!);
    expect(onInsertLibraryItems).toHaveBeenCalledTimes(1);
    const [inserted] = onInsertLibraryItems.mock.calls[0][0];
    expect(inserted.id).toBe("a");
    expect(inserted.elements).toHaveLength(1);
    expect(inserted.elements[0].id).not.toBe(item.elements[0].id);
  });

  it("serializes dragged item ids", async () => {
    const items = ["a", "b"].map((id) => makeItem(id, id));
    const { container } = render(Wrapper, {
      ...baseProps(),
      libraryItems: items,
      selectedItems: ["a", "b"],
    });
    await waitFor(() => expect(renderedUnits(container).length).toBe(2));
    const setData = vi.fn();
    await fireEvent.dragStart(container.querySelector(".library-unit__dragger")!, {
      dataTransfer: { setData },
    });
    expect(setData).toHaveBeenCalledTimes(1);
    expect(JSON.parse(setData.mock.calls[0][1])).toEqual({
      itemIds: ["a", "b"],
    });
  });
});
