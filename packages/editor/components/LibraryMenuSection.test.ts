import { tick } from "svelte";
import { render } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setEditorContext } from "../ui/editorContext";

import LibraryMenuSection from "./LibraryMenuSection.svelte";

import type { EditorContextValue } from "../ui/editorContext";

vi.mock("./Tooltip", () => ({ showTooltip: vi.fn(), hideTooltip: vi.fn() }));
vi.mock("../scene/export", () => ({
  exportScene: vi.fn(async () =>
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  ),
}));

const Wrapper = (...args: Parameters<typeof LibraryMenuSection>) => {
  setEditorContext({
    editorInterface: { formFactor: "desktop" },
  } as unknown as EditorContextValue);
  return LibraryMenuSection(...args);
};

const makeItems = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `id${i}`,
    status: "unpublished" as const,
    created: 0,
    elements: [{ id: `el${i}` }] as any,
  }));

describe("LibraryMenuSection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders items progressively in batches, skeletons for the rest", async () => {
    const { container } = render(Wrapper, {
      items: makeItems(5),
      onClick: vi.fn(),
      onItemSelectToggle: vi.fn(),
      onItemDrag: vi.fn(),
      isItemSelected: (id: string | null) => id === "id1",
      svgCache: new Map(),
      itemsRenderedPerBatch: 2,
    });
    const units = () => container.querySelectorAll(".library-unit");
    const active = () => container.querySelectorAll(".library-unit__active");

    expect(units().length).toBe(5);
    expect(active().length).toBe(0);

    vi.advanceTimersByTime(0);
    await tick();
    expect(active().length).toBe(2);
    expect(units().length).toBe(5);

    vi.advanceTimersByTime(0);
    await tick();
    expect(active().length).toBe(4);

    vi.advanceTimersByTime(0);
    await tick();
    expect(active().length).toBe(5);
    expect(container.querySelectorAll(".library-unit--selected").length).toBe(1);
  });

  it("renders a pending item (no id) with the adder", async () => {
    const { container } = render(Wrapper, {
      items: [{ id: null, elements: [{ id: "el" }] as any }],
      onClick: vi.fn(),
      onItemSelectToggle: vi.fn(),
      onItemDrag: vi.fn(),
      isItemSelected: () => false,
      svgCache: new Map(),
      itemsRenderedPerBatch: 10,
    });
    vi.advanceTimersByTime(0);
    await tick();
    expect(container.querySelector(".library-unit__adder")).not.toBeNull();
  });
});
