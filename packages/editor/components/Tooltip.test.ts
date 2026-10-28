import { createRawSnippet } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  TOOLTIP_CLASS,
  TOOLTIP_DELAY,
  TOOLTIP_VISIBLE_CLASS,
  getTooltipDiv,
  hideDocumentTooltip,
  hideTooltip,
  showTooltip,
  updateTooltipPosition,
} from "./Tooltip";
import Tooltip from "./Tooltip.svelte";

const child = createRawSnippet(() => ({
  render: () => `<button data-testid="inner">hover me</button>`,
}));

const tooltipEl = () =>
  document.querySelector<HTMLDivElement>(`.${TOOLTIP_CLASS}`);

afterEach(() => {
  hideTooltip();
  document.querySelectorAll(`.${TOOLTIP_CLASS}`).forEach((el) => el.remove());
});

describe("Tooltip component", () => {
  it("wraps children and shows the label on pointerenter", async () => {
    const { container } = render(Tooltip, {
      label: "Hello",
      class: "mine",
      style: "color: red",
      children: child,
    });
    const wrapper = container.querySelector(".excalidraw-tooltip-wrapper") as HTMLElement;
    expect(wrapper).toHaveClass("mine");
    expect(wrapper.style.color).toBe("red");
    expect(screen.getByTestId("inner")).toBeInTheDocument();

    await fireEvent.pointerEnter(wrapper);
    expect(tooltipEl()).toHaveClass(TOOLTIP_VISIBLE_CLASS);
    expect(tooltipEl()).toHaveTextContent("Hello");
    expect(tooltipEl()!.style.minWidth).toBe("10ch");

    await fireEvent.pointerLeave(wrapper);
    expect(tooltipEl()).not.toHaveClass(TOOLTIP_VISIBLE_CLASS);
  });

  it("uses the long size", async () => {
    const { container } = render(Tooltip, { label: "L", long: true, children: child });
    await fireEvent.pointerEnter(container.querySelector(".excalidraw-tooltip-wrapper")!);
    expect(tooltipEl()!.style.minWidth).toBe("50ch");
    expect(tooltipEl()!.style.maxWidth).toBe("50ch");
  });

  it("renders nothing when disabled", () => {
    const { container } = render(Tooltip, { label: "x", disabled: true, children: child });
    expect(container.querySelector(".excalidraw-tooltip-wrapper")).toBeNull();
  });
});

describe("showTooltip / hideTooltip", () => {
  const makeItem = () => {
    const item = document.createElement("button");
    document.body.appendChild(item);
    return item;
  };

  it("reuses a single tooltip div per document", () => {
    const a = getTooltipDiv(document);
    const b = getTooltipDiv(document);
    expect(a).toBe(b);
    expect(document.querySelectorAll(`.${TOOLTIP_CLASS}`)).toHaveLength(1);
  });

  it("delays a `delay`ed tooltip and cancels it on hide", () => {
    vi.useFakeTimers();
    try {
      const item = makeItem();
      // leave the warm window of tooltips hidden by earlier tests
      vi.advanceTimersByTime(1000);
      showTooltip(item, "later", { delay: true });
      expect(tooltipEl()).toBeNull();
      vi.advanceTimersByTime(TOOLTIP_DELAY);
      expect(tooltipEl()).toHaveClass(TOOLTIP_VISIBLE_CLASS);
      hideTooltip();

      // right after hiding, a delayed tooltip is warm and shows immediately
      showTooltip(item, "now", { delay: true });
      expect(tooltipEl()).toHaveClass(TOOLTIP_VISIBLE_CLASS);
      hideTooltip();
      item.remove();
    } finally {
      vi.useRealTimers();
    }
  });

  it("hideDocumentTooltip hides the document's tooltip", () => {
    const item = makeItem();
    showTooltip(item, "x");
    expect(tooltipEl()).toHaveClass(TOOLTIP_VISIBLE_CLASS);
    hideDocumentTooltip(document);
    expect(tooltipEl()).not.toHaveClass(TOOLTIP_VISIBLE_CLASS);
    item.remove();
  });

  it("hides the tooltip when its item is removed from the DOM", async () => {
    const item = makeItem();
    showTooltip(item, "x");
    item.remove();
    await vi.waitFor(() =>
      expect(tooltipEl()).not.toHaveClass(TOOLTIP_VISIBLE_CLASS),
    );
  });
});

describe("updateTooltipPosition", () => {
  const tooltip = () => {
    const el = document.createElement("div");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      width: 100,
      height: 20,
    } as DOMRect);
    return el;
  };

  it("places the tooltip below, centered on the item", () => {
    const el = tooltip();
    updateTooltipPosition(el, { left: 400, top: 100, width: 50, height: 30 });
    expect(el.style.left).toBe("375px");
    expect(el.style.top).toBe("135px");
  });

  it("flips above when there is no room below", () => {
    const el = tooltip();
    updateTooltipPosition(el, {
      left: 400,
      top: window.innerHeight - 10,
      width: 50,
      height: 30,
    });
    expect(el.style.top).toBe(`${window.innerHeight - 10 - 20 - 5}px`);
  });

  it("keeps the tooltip within the viewport horizontally", () => {
    const el = tooltip();
    updateTooltipPosition(el, { left: 0, top: 100, width: 10, height: 10 });
    expect(el.style.left).toBe("5px");
  });
});
