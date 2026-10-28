import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createFakeEditorContext } from "./overlayTestUtils";
import ToolPopoverHarness from "./ToolPopoverHarness.test.svelte";

beforeAll(() => {
  (globalThis as any).ResizeObserver ||= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const icon = (id: string) => ({
  html: `<svg data-icon="${id}" viewBox="0 0 1 1"></svg>`,
});

const options = [
  { type: "line", icon: icon("line"), title: "line" },
  { type: "arrow", icon: icon("arrow"), title: "arrow", fillable: true },
];

const setup = (
  overrides: {
    activeToolType?: string;
    appProps?: Record<string, unknown>;
  } = {},
) => {
  let pointerDownListener: (() => void) | null = null;
  const unsubscribe = vi.fn();
  const app = {
    ownerWindow: window,
    ownerDocument: document,
    state: { activeTool: { type: overrides.activeToolType ?? "selection" } },
    props: overrides.appProps ?? {},
    setActiveTool: vi.fn(),
    onPointerDownEmitter: {
      on: (listener: () => void) => {
        pointerDownListener = listener;
        return unsubscribe;
      },
    },
  };
  const { ctx } = createFakeEditorContext({ app: app as any });
  const onToolChange = vi.fn();
  const view = render(ToolPopoverHarness, {
    ctx,
    app,
    options,
    activeToolType: overrides.activeToolType ?? "selection",
    defaultOption: "line",
    displayedOption: options[0],
    onToolChange,
  });
  return {
    ...view,
    app,
    onToolChange,
    unsubscribe,
    emitPointerDown: () => pointerDownListener?.(),
  };
};

const getToggle = () =>
  document.querySelector<HTMLElement>('[data-testid="toolbar-line-group"]')!;
const getContent = () =>
  document.querySelector<HTMLElement>(".tool-popover-content");

describe("ToolPopover", () => {
  it("renders the displayed option as the toggle button", () => {
    setup();
    const toggle = getToggle();
    expect(toggle).toHaveAttribute("aria-label", "Line");
    expect(toggle).toHaveAttribute("title", "Line");
    expect(toggle.querySelector('svg[data-icon="line"]')).not.toBeNull();
    expect(getContent()).toBeNull();
  });

  it("opens the options and activates the default option on toggle", async () => {
    const { onToolChange } = setup();
    await fireEvent.click(getToggle());

    await waitFor(() => expect(getContent()).not.toBeNull());
    expect(onToolChange).toHaveBeenCalledWith("line");
    const content = getContent()!;
    expect(
      content.querySelector('[data-testid="toolbar-line"]'),
    ).not.toBeNull();
    const arrow = content.querySelector('[data-testid="toolbar-arrow"]')!;
    expect(arrow).toHaveAttribute("aria-label", "Arrow");
    expect(arrow).toHaveClass("fillable");
  });

  it("toggles the popup closed on a second press", async () => {
    setup();
    await fireEvent.click(getToggle());
    await waitFor(() => expect(getContent()).not.toBeNull());
    await fireEvent.click(getToggle());
    await waitFor(() => expect(getContent()).toBeNull());
  });

  it("activates a chosen option", async () => {
    const { app, onToolChange } = setup();
    await fireEvent.click(getToggle());
    await waitFor(() => expect(getContent()).not.toBeNull());

    await fireEvent.click(
      getContent()!.querySelector('[data-testid="toolbar-arrow"]')!,
    );
    expect(app.setActiveTool).toHaveBeenCalledWith({ type: "arrow" });
    expect(onToolChange).toHaveBeenLastCalledWith("arrow");
  });

  it("does not re-activate the active tool", async () => {
    const { app } = setup({ activeToolType: "arrow" });
    await fireEvent.click(getToggle());
    await waitFor(() => expect(getContent()).not.toBeNull());
    await fireEvent.click(
      getContent()!.querySelector('[data-testid="toolbar-arrow"]')!,
    );
    expect(app.setActiveTool).not.toHaveBeenCalled();
  });

  it("closes when the pointer goes down on the canvas", async () => {
    const { emitPointerDown } = setup();
    await fireEvent.click(getToggle());
    await waitFor(() => expect(getContent()).not.toBeNull());
    emitPointerDown();
    await waitFor(() => expect(getContent()).toBeNull());
  });

  it("closes when the active tool is not one of the options", async () => {
    const { component } = setup({ activeToolType: "line" });
    await fireEvent.click(getToggle());
    await waitFor(() => expect(getContent()).not.toBeNull());
    component.setActiveToolType("selection");
    await waitFor(() => expect(getContent()).toBeNull());
  });

  it("disables the buttons when the host forces another tool", () => {
    setup({ appProps: { activeTool: { type: "rectangle" } } });
    expect(getToggle()).toBeDisabled();
  });

  it("unsubscribes from the pointer down emitter on destroy", () => {
    const { unmount, unsubscribe } = setup();
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
