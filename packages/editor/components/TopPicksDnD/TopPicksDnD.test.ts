import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createFakeEditorContext } from "../overlayTestUtils";

import TopPicksContextMenuHarness from "./TopPicksContextMenuHarness.test.svelte";
import TopPicksDnDOutline from "./TopPicksDnDOutline.svelte";
import TopPicksTip from "./TopPicksTip.svelte";
import { getTopPickReorderOffset } from "./topPicksDnD.svelte";

beforeAll(() => {
  (globalThis as any).ResizeObserver ||= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("getTopPickReorderOffset", () => {
  const dragState = (from: number, to: number | null) => ({
    value: "x",
    origin: { kind: "pick" as const, index: from },
    overIndex: to,
    duplicateIndex: null,
    slotSpan: 40,
  });

  it("is zero without a reorder drag", () => {
    expect(getTopPickReorderOffset(null, 0)).toBe(0);
    expect(
      getTopPickReorderOffset(
        {
          value: "x",
          origin: { kind: "source" },
          overIndex: 1,
          duplicateIndex: null,
          slotSpan: 40,
        },
        0,
      ),
    ).toBe(0);
    expect(getTopPickReorderOffset(dragState(0, null), 0)).toBe(0);
    expect(getTopPickReorderOffset(dragState(1, 1), 1)).toBe(0);
  });

  it("moves the dragged pick to the hovered slot and shifts the ones between", () => {
    // dragging pick 0 over slot 2: 0 -> 2, 1 -> 0, 2 -> 1
    expect(getTopPickReorderOffset(dragState(0, 2), 0)).toBe(2 * 40);
    expect(getTopPickReorderOffset(dragState(0, 2), 1)).toBe(-40);
    expect(getTopPickReorderOffset(dragState(0, 2), 2)).toBe(-40);
    // picks beyond the slot stay
    expect(getTopPickReorderOffset(dragState(0, 2), 3)).toBe(0);
    // dragging pick 2 over slot 0: 2 -> 0, 0 -> 1, 1 -> 2
    expect(getTopPickReorderOffset(dragState(2, 0), 2)).toBe(-2 * 40);
    expect(getTopPickReorderOffset(dragState(2, 0), 0)).toBe(40);
    expect(getTopPickReorderOffset(dragState(2, 0), 1)).toBe(40);
  });
});

describe("TopPicksDnDOutline", () => {
  it("renders the decorative outline", () => {
    const { container } = render(TopPicksDnDOutline);
    const svg = container.querySelector("svg.top-picks-dnd__outline");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg!.querySelector("rect")).not.toBeNull();
  });
});

describe("TopPicksTip", () => {
  it("shows the tip without a reset link when nothing is customized", () => {
    const { container } = render(TopPicksTip, {
      tip: "Drag to pin",
      resetTitle: "Reset",
      class: "extra",
    });
    const tip = container.querySelector(".top-picks-dnd__tip")!;
    expect(tip).toHaveClass("extra");
    expect(tip).toHaveTextContent("Drag to pin");
    expect(container.querySelector(".top-picks-dnd__tip-reset")).toBeNull();
  });

  it("resets through the link and keeps the focus on the picker", async () => {
    const onReset = vi.fn();
    const wrapper = document.createElement("div");
    wrapper.tabIndex = -1;
    document.body.appendChild(wrapper);
    render(TopPicksTip, {
      target: wrapper,
      props: { tip: "Drag to pin", resetTitle: "Reset", onReset },
    });
    const link = wrapper.querySelector<HTMLButtonElement>(
      ".top-picks-dnd__tip-reset",
    )!;
    expect(link).toHaveAttribute("title", "Reset");

    // pressing it doesn't take the focus
    await expect(fireEvent.mouseDown(link)).resolves.toBe(false);

    link.focus();
    expect(document.activeElement).toBe(link);
    await fireEvent.click(link);
    expect(onReset).toHaveBeenCalledTimes(1);
    // handed back to the closest focusable ancestor
    expect(document.activeElement).toBe(wrapper);
  });

  it("keeps Enter and Space to the link", async () => {
    const onReset = vi.fn();
    const outer = vi.fn();
    const wrapper = document.createElement("div");
    document.body.appendChild(wrapper);
    // above the root Svelte delegates the events at
    document.body.addEventListener("keydown", outer);
    render(TopPicksTip, {
      target: wrapper,
      props: { tip: "t", resetTitle: "r", onReset },
    });
    const link = wrapper.querySelector<HTMLElement>(
      ".top-picks-dnd__tip-reset",
    )!;
    await fireEvent.keyDown(link, { key: "Enter" });
    await fireEvent.keyDown(link, { key: " " });
    expect(outer).not.toHaveBeenCalled();
    await fireEvent.keyDown(link, { key: "ArrowDown" });
    expect(outer).toHaveBeenCalledTimes(1);
    document.body.removeEventListener("keydown", outer);
  });
});

describe("TopPicksContextMenu", () => {
  const setup = (props: { onReset?: () => void; isCustomized: boolean }) => {
    const { ctx } = createFakeEditorContext();
    return render(TopPicksContextMenuHarness, { ctx, ...props });
  };

  it("renders the strip as-is when not customizable", async () => {
    setup({ isCustomized: true });
    const strip = screen.getByTestId("strip");
    expect(strip).not.toHaveAttribute("data-context-menu-trigger");
    await fireEvent.contextMenu(strip);
    expect(document.querySelector(".top-picks-dnd__context-menu")).toBeNull();
  });

  it("opens a menu with a reset item on right click", async () => {
    const onReset = vi.fn();
    setup({ onReset, isCustomized: true });
    await fireEvent.contextMenu(screen.getByTestId("strip"));

    const item = await waitFor(() => {
      const found = document.querySelector<HTMLElement>(
        ".top-picks-dnd__context-menu .top-picks-dnd__context-menu-item",
      );
      expect(found).not.toBeNull();
      return found!;
    });
    expect(item).toHaveTextContent("Reset picks");
    expect(item).not.toHaveAttribute("data-disabled");

    await fireEvent.click(item);
    await waitFor(() => expect(onReset).toHaveBeenCalledTimes(1));
  });

  it("disables the reset item while the picks are not customized", async () => {
    const onReset = vi.fn();
    setup({ onReset, isCustomized: false });
    await fireEvent.contextMenu(screen.getByTestId("strip"));

    const item = await waitFor(() => {
      const found = document.querySelector<HTMLElement>(
        ".top-picks-dnd__context-menu-item",
      );
      expect(found).not.toBeNull();
      return found!;
    });
    expect(item).toHaveAttribute("data-disabled");
    await fireEvent.click(item);
    expect(onReset).not.toHaveBeenCalled();
  });
});
