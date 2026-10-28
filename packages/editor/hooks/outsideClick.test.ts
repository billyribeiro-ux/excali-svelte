import { describe, expect, it, vi } from "vitest";

import { outsideClick } from "./outsideClick";

const setup = (
  callback: (event: any) => void,
  isInside?: Parameters<typeof outsideClick>[1],
) => {
  const container = document.createElement("div");
  const inner = document.createElement("button");
  container.appendChild(inner);
  const outside = document.createElement("span");
  document.body.append(container, outside);
  const cleanup = outsideClick(callback, isInside)(container) as () => void;
  return {
    container,
    inner,
    outside,
    cleanup: () => {
      cleanup();
      container.remove();
      outside.remove();
    },
  };
};

const press = (target: Element, type = "pointerdown") =>
  target.dispatchEvent(new Event(type, { bubbles: true }));

describe("outsideClick", () => {
  it("calls back for pointerdown and touchstart outside the container", () => {
    const callback = vi.fn();
    const { outside, cleanup } = setup(callback);
    press(outside);
    press(outside, "touchstart");
    expect(callback).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it("ignores events inside the container", () => {
    const callback = vi.fn();
    const { container, inner, cleanup } = setup(callback);
    press(container);
    press(inner);
    expect(callback).not.toHaveBeenCalled();
    cleanup();
  });

  it("ignores targets detached from the document", () => {
    const callback = vi.fn();
    const { cleanup } = setup(callback);
    const detached = document.createElement("div");
    document.body.appendChild(detached);
    document.addEventListener(
      "pointerdown",
      () => detached.remove(),
      { once: true, capture: true },
    );
    press(detached);
    expect(callback).not.toHaveBeenCalled();
    cleanup();
  });

  it("ignores clicks on floating (Bits UI) portals and prevent-outside-click containers", () => {
    const callback = vi.fn();
    const { outside, cleanup } = setup(callback);

    const floating = document.createElement("div");
    floating.setAttribute("data-bits-floating-content-wrapper", "");
    const floatingChild = document.createElement("button");
    floating.appendChild(floatingChild);

    const prevent = document.createElement("div");
    prevent.setAttribute("data-prevent-outside-click", "");
    const preventChild = document.createElement("button");
    prevent.appendChild(preventChild);

    document.body.append(floating, prevent);
    press(floatingChild);
    press(preventChild);
    expect(callback).not.toHaveBeenCalled();

    press(outside);
    expect(callback).toHaveBeenCalledTimes(1);
    floating.remove();
    prevent.remove();
    cleanup();
  });

  it("treats html as part of the UI while a modal popup disabled body pointer events", () => {
    const callback = vi.fn();
    const { cleanup } = setup(callback);
    document.body.style.pointerEvents = "none";
    document.documentElement.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(callback).not.toHaveBeenCalled();
    document.body.style.pointerEvents = "";
    cleanup();
  });

  it("lets isInside override the default in both directions", () => {
    const callback = vi.fn();
    let verdict: boolean | undefined = true;
    const { container, outside, cleanup } = setup(callback, (_event, element) => {
      expect(element).toBe(container);
      return verdict;
    });

    press(outside);
    expect(callback).not.toHaveBeenCalled();

    verdict = false;
    press(container);
    expect(callback).toHaveBeenCalledTimes(1);

    verdict = undefined;
    press(container);
    expect(callback).toHaveBeenCalledTimes(1);
    press(outside);
    expect(callback).toHaveBeenCalledTimes(2);
    cleanup();
  });

  it("stops listening after cleanup", () => {
    const callback = vi.fn();
    const { outside, cleanup } = setup(callback);
    cleanup();
    document.body.appendChild(outside);
    press(outside);
    expect(callback).not.toHaveBeenCalled();
    outside.remove();
  });
});
