import { render, waitFor } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createFakeEditorContext } from "./overlayTestUtils";
import PropertiesPopoverHarness from "./PropertiesPopoverHarness.test.svelte";

beforeAll(() => {
  (globalThis as any).ResizeObserver ||= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const setup = (
  editorInterface: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
) => {
  const container = document.createElement("div");
  container.tabIndex = -1;
  document.body.appendChild(container);
  const { ctx } = createFakeEditorContext({
    app: { ownerWindow: window, ownerDocument: document } as any,
    editorInterface: {
      formFactor: "desktop",
      isLandscape: true,
      isTouchScreen: false,
      ...editorInterface,
    } as any,
  });
  const onClose = vi.fn();
  const view = render(PropertiesPopoverHarness, {
    ctx,
    container,
    onClose,
    ...extra,
  });
  return { ...view, onClose, container };
};

const getContent = () =>
  document.querySelector<HTMLElement>("[data-popover-content]")!;

describe("PropertiesPopover", () => {
  it("renders its children in an island inside the portal container", async () => {
    const { container } = setup();
    await waitFor(() => expect(getContent()).not.toBeNull());
    const content = getContent();
    expect(container.contains(content)).toBe(true);
    expect(content).toHaveClass("focus-visible-none", "custom-class");
    expect(content).toHaveAttribute("data-prevent-outside-click");
    const island = content.querySelector<HTMLElement>(".Island")!;
    expect(island).not.toBeNull();
    expect(island.getAttribute("style")).toContain("max-width: 13rem");
    expect(island.querySelector('[data-testid="popover-body"]')).not.toBeNull();
  });

  it("opens to the right of the trigger on desktop", async () => {
    setup();
    await waitFor(() => expect(getContent()).not.toBeNull());
    expect(getContent()).toHaveAttribute("data-side", "right");
    expect(getContent()).toHaveAttribute("data-align", "start");
  });

  it("opens below the trigger on a portrait phone", async () => {
    setup({ formFactor: "phone", isLandscape: false });
    await waitFor(() => expect(getContent()).not.toBeNull());
    expect(getContent()).toHaveAttribute("data-side", "bottom");
    expect(getContent()).toHaveAttribute("data-align", "center");
    expect(getContent().getAttribute("style")).toContain(
      "z-index: var(--zIndex-ui-styles-popup)",
    );
    expect(getContent().getAttribute("style")).toContain("margin-left: 0.5rem");
  });

  it("forwards keydown to the handler", async () => {
    const onkeydown = vi.fn();
    setup({}, { onkeydown });
    await waitFor(() => expect(getContent()).not.toBeNull());
    getContent().dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", bubbles: true }),
    );
    expect(onkeydown).toHaveBeenCalledTimes(1);
  });

  it("calls onClose and hands focus to the container when closed", async () => {
    const { component, onClose, container } = setup();
    await waitFor(() => expect(getContent()).not.toBeNull());

    component.setOpen(false);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(document.activeElement).toBe(container);
  });
});
