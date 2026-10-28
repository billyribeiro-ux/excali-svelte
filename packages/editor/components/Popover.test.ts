import { render, screen } from "@testing-library/svelte";
import { createRawSnippet, tick } from "svelte";
import { describe, expect, it, vi } from "vitest";

import Popover from "./Popover.svelte";

const mockPopoverDimensions = (width: number, height: number) => {
  const getBoundingClientRect = vi
    .spyOn(HTMLDivElement.prototype, "getBoundingClientRect")
    .mockReturnValue({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

  return () => {
    getBoundingClientRect.mockRestore();
  };
};

describe("Popover", () => {
  it("shifts overflowing content within its positioning container", async () => {
    const restoreDimensions = mockPopoverDimensions(100, 80);

    try {
      const { container } = render(Popover, {
        left: 180,
        top: 180,
        fitInViewport: true,
        viewportWidth: 200,
        viewportHeight: 200,
      });
      await tick();
      const popover = container.querySelector<HTMLDivElement>(".popover")!;

      expect(popover.style.left).toBe("90px");
      expect(popover.style.top).toBe("110px");
    } finally {
      restoreDimensions();
    }
  });

  it("resizes oversized content within the container gap", async () => {
    const restoreDimensions = mockPopoverDimensions(250, 250);

    try {
      const { container } = render(Popover, {
        left: 180,
        top: 180,
        fitInViewport: true,
        viewportWidth: 200,
        viewportHeight: 200,
      });
      await tick();
      const popover = container.querySelector<HTMLDivElement>(".popover")!;

      expect(popover.style.width).toBe("180px");
      expect(popover.style.height).toBe("180px");
      expect(popover.style.left).toBe("10px");
      expect(popover.style.top).toBe("10px");
      expect(popover.style.overflowX).toBe("scroll");
      expect(popover.style.overflowY).toBe("scroll");
    } finally {
      restoreDimensions();
    }
  });

  const buttons = createRawSnippet(() => ({
    render: () =>
      `<div><button data-testid="first">a</button><button data-testid="last">b</button></div>`,
  }));

  it("renders a focusable container with the popover class and focuses it", async () => {
    const { container } = render(Popover, { class: "extra", children: buttons });
    await tick();
    const popover = container.querySelector<HTMLDivElement>(".popover")!;
    expect(popover).toHaveClass("popover", "extra");
    expect(popover).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(popover);
  });

  it("traps Tab focus inside the popover", async () => {
    const { container } = render(Popover, { children: buttons });
    await tick();
    const popover = container.querySelector<HTMLDivElement>(".popover")!;
    const first = screen.getByTestId("first");
    const last = screen.getByTestId("last");

    // Tab from the container itself goes to the first focusable
    popover.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(first);

    // Shift+Tab on the first wraps to the last
    const shiftTab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    // Tab on the last wraps to the first
    last.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(first);
  });

  it("calls onCloseRequest only for pointerdown outside the popover", async () => {
    const onCloseRequest = vi.fn();
    const { container } = render(Popover, {
      onCloseRequest,
      children: buttons,
    });
    await tick();
    const popover = container.querySelector<HTMLDivElement>(".popover")!;

    popover.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(onCloseRequest).not.toHaveBeenCalled();

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
  });
});
