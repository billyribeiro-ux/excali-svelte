import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setEditorContext } from "../ui/editorContext";

import EmptyLibraryUnit from "./EmptyLibraryUnit.svelte";
import LibraryUnit from "./LibraryUnit.svelte";

import type { EditorContextValue } from "../ui/editorContext";

const { showTooltip, hideTooltip, exportScene } = vi.hoisted(() => ({
  showTooltip: vi.fn(),
  hideTooltip: vi.fn(),
  exportScene: vi.fn(),
}));

vi.mock("./Tooltip", () => ({ showTooltip, hideTooltip }));
vi.mock("../scene/export", () => ({ exportScene }));

const withContext = (formFactor: "phone" | "desktop") =>
  function Wrapper(...args: Parameters<typeof LibraryUnit>) {
    setEditorContext({
      editorInterface: { formFactor },
    } as unknown as EditorContextValue);
    return LibraryUnit(...args);
  };

const makeSvg = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-testid", "preview-svg");
  return svg;
};

const baseProps = () => ({
  id: "item1" as string | null,
  elements: [{ id: "el" }] as any,
  onClick: vi.fn(),
  onToggle: vi.fn(),
  onDrag: vi.fn(),
  selected: false,
  svgCache: new Map(),
});

describe("LibraryUnit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportScene.mockImplementation(async () => makeSvg());
  });

  it("is a skeleton until the preview svg is rendered into the dragger", async () => {
    const { container } = render(withContext("desktop"), baseProps());
    const unit = container.querySelector(".library-unit")!;
    expect(unit).toHaveClass("library-unit__active", "library-unit--skeleton");
    await waitFor(() =>
      expect(unit).not.toHaveClass("library-unit--skeleton"),
    );
    expect(
      container.querySelector(".library-unit__dragger svg"),
    ).not.toBeNull();
  });

  it("calls onClick with the id, and onToggle on shift+click", async () => {
    const props = baseProps();
    const { container } = render(withContext("desktop"), props);
    const dragger = container.querySelector(".library-unit__dragger")!;
    await fireEvent.click(dragger);
    expect(props.onClick).toHaveBeenCalledWith("item1");
    await fireEvent.click(dragger, { shiftKey: true });
    expect(props.onToggle).toHaveBeenCalledTimes(1);
    expect(props.onToggle.mock.calls[0][0]).toBe("item1");
  });

  it("renders the pending adder and prevents dragging of pending items", async () => {
    const props = { ...baseProps(), id: null, isPending: true };
    const { container } = render(withContext("desktop"), props);
    expect(container.querySelector(".library-unit__adder")).not.toBeNull();
    expect(container.querySelector(".library-unit__dragger")).toHaveClass(
      "library-unit__pulse",
    );
    const event = new Event("dragstart", { cancelable: true, bubbles: true });
    container.querySelector(".library-unit__dragger")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(props.onDrag).not.toHaveBeenCalled();
  });

  it("calls onDrag for items with an id", async () => {
    const props = baseProps();
    const { container } = render(withContext("desktop"), props);
    await fireEvent.dragStart(container.querySelector(".library-unit__dragger")!);
    expect(props.onDrag).toHaveBeenCalledTimes(1);
    expect(props.onDrag.mock.calls[0][0]).toBe("item1");
  });

  it("shows the selection checkbox on hover, when selected, and always on phones", async () => {
    const props = baseProps();
    const { container, unmount } = render(withContext("desktop"), props);
    const unit = container.querySelector(".library-unit")!;
    expect(container.querySelector(".library-unit__checkbox")).toBeNull();
    await fireEvent.mouseEnter(unit);
    expect(unit).toHaveClass("library-unit--hover");
    expect(container.querySelector(".library-unit__checkbox")).not.toBeNull();
    await fireEvent.mouseLeave(unit);
    expect(container.querySelector(".library-unit__checkbox")).toBeNull();
    unmount();

    const selected = render(withContext("desktop"), {
      ...baseProps(),
      selected: true,
    });
    expect(
      selected.container.querySelector(".library-unit__checkbox"),
    ).not.toBeNull();
    expect(selected.container.querySelector(".library-unit")).toHaveClass(
      "library-unit--selected",
    );
    selected.unmount();

    const phone = render(withContext("phone"), baseProps());
    expect(
      phone.container.querySelector(".library-unit__checkbox"),
    ).not.toBeNull();
  });

  it("toggles via the checkbox", async () => {
    const props = { ...baseProps(), selected: true };
    const { container } = render(withContext("desktop"), props);
    await fireEvent.click(container.querySelector(".library-unit__checkbox")!);
    expect(props.onToggle.mock.calls[0][0]).toBe("item1");
  });

  it("shows a tooltip with the name on pointer enter and hides it on leave/down", async () => {
    const props = { ...baseProps(), name: "My item" };
    const { container } = render(withContext("desktop"), props);
    const unit = container.querySelector(".library-unit")!;
    await fireEvent.pointerEnter(unit);
    expect(showTooltip).toHaveBeenCalledWith(unit, "My item", {
      delay: true,
      position: "top",
    });
    await fireEvent.pointerLeave(unit);
    await fireEvent.pointerDown(unit);
    expect(hideTooltip).toHaveBeenCalledTimes(2);
  });

  it("does not show a tooltip for unnamed items", async () => {
    const { container } = render(withContext("desktop"), baseProps());
    await fireEvent.pointerEnter(container.querySelector(".library-unit")!);
    expect(showTooltip).not.toHaveBeenCalled();
  });

  it("with showName renders preview + name and skips the tooltip when the name is not truncated", async () => {
    const props = { ...baseProps(), name: "Wide name", showName: true };
    const { container } = render(withContext("desktop"), props);
    expect(container.querySelector(".library-unit")).toHaveClass(
      "library-unit--named",
    );
    expect(container.querySelector(".library-unit__name")).toHaveTextContent(
      "Wide name",
    );
    await waitFor(() =>
      expect(
        container.querySelector(".library-unit__preview svg"),
      ).not.toBeNull(),
    );
    // jsdom: scrollWidth === clientWidth === 0, i.e. not truncated
    await fireEvent.pointerEnter(container.querySelector(".library-unit")!);
    expect(showTooltip).not.toHaveBeenCalled();
  });
});

describe("EmptyLibraryUnit", () => {
  it("renders a skeleton unit", () => {
    const { container } = render(EmptyLibraryUnit, { showName: true });
    expect(container.firstElementChild).toHaveClass(
      "library-unit",
      "library-unit--skeleton",
      "library-unit--named",
    );
  });
});
