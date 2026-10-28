import { fireEvent, } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME } from "@svelte-draw/common";

import { editorJotaiStore } from "../editor-jotai";

import { activeEyeDropperAtom, eyeDropperCursor } from "./EyeDropper";
import EyeDropper from "./EyeDropper.svelte";
import {
  createFakeEditorContext,
  renderWithEditorContext,
} from "./overlayTestUtils";

const setup = (appState: Record<string, any> = {}) => {
  const excalidrawContainer = document.createElement("div");
  excalidrawContainer.tabIndex = -1;
  const slot = document.createElement("div");
  slot.className = "excalidraw-eye-dropper-container";
  excalidrawContainer.appendChild(slot);
  document.body.appendChild(excalidrawContainer);

  const canvas = document.createElement("canvas");
  const getImageData = vi.fn(() => ({
    data: new Uint8ClampedArray([18, 18, 18, 255]),
  }));
  canvas.getContext = (() => ({ getImageData })) as any;

  const fake = createFakeEditorContext({
    app: {
      canvas,
      ownerWindow: window,
      ownerDocument: document,
      viewport: { lastPosition: { x: 0, y: 0 } },
    } as any,
    container: excalidrawContainer as HTMLDivElement,
    appState,
  });

  const props = {
    onCancel: vi.fn(),
    onSelect: vi.fn(),
    onChange: vi.fn(),
    colorPickerType: "elementBackground" as const,
  };
  const view = renderWithEditorContext(EyeDropper, props, fake.ctx);
  const backdrop = () =>
    excalidrawContainer.querySelector<HTMLDivElement>(
      ".excalidraw-eye-dropper-backdrop",
    );
  const preview = () =>
    excalidrawContainer.querySelector<HTMLDivElement>(
      ".excalidraw-eye-dropper-preview",
    );
  return { ...view, props, getImageData, backdrop, preview, fake, canvas };
};

describe("EyeDropper", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });
  afterEach(() => {
    editorJotaiStore.set(activeEyeDropperAtom, null);
  });

  it("creates the backdrop with the eye dropper cursor, and the preview in it", async () => {
    const { backdrop, preview } = setup();
    await tick();
    expect(backdrop()).not.toBeNull();
    expect(backdrop()!.classList.contains("excalidraw")).toBe(true);
    expect(backdrop()!.style.cursor).toBeTruthy();
    expect(eyeDropperCursor).toMatch(/^url\(data:image\/svg\+xml/);
    expect(eyeDropperCursor).toMatch(/\) 2 21, auto$/);
    expect(backdrop()!.contains(preview())).toBe(true);
  });

  it("keeps the color preview within the eye dropper container", async () => {
    const { backdrop, preview } = setup();
    await tick();
    backdrop()!.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      right: 500,
      bottom: 350,
      width: 400,
      height: 300,
      x: 100,
      y: 50,
      toJSON: () => {},
    });
    Object.defineProperties(preview()!, {
      offsetWidth: { configurable: true, value: 48 },
      offsetHeight: { configurable: true, value: 48 },
    });

    // fits within the viewport, but not within the container
    await fireEvent.pointerMove(window, { clientX: 480, clientY: 330 });

    expect(preview()!.style.left).toBe("325px");
    expect(preview()!.style.top).toBe("225px");
  });

  it("contrasts the preview border with the sampled color", async () => {
    const { preview, getImageData } = setup();
    await tick();
    expect(
      preview()!.style.getPropertyValue("--eye-dropper-preview-border-color"),
    ).toBe("#fff");

    getImageData.mockReturnValue({
      data: new Uint8ClampedArray([237, 237, 237, 255]),
    } as any);
    await fireEvent.pointerMove(window, { clientX: 50, clientY: 50 });
    expect(
      preview()!.style.getPropertyValue("--eye-dropper-preview-border-color"),
    ).toBe("#222");
  });

  it("selects the sampled color on pointerup", async () => {
    const { backdrop, props } = setup();
    await tick();
    await fireEvent.pointerUp(backdrop()!, { clientX: 50, clientY: 50 });
    expect(props.onSelect).toHaveBeenCalledTimes(1);
    expect(props.onSelect.mock.calls[0][0]).toBe("#121212");
  });

  it("applies the unfiltered color in dark mode", async () => {
    const { backdrop, props } = setup({ theme: THEME.DARK });
    await tick();
    await fireEvent.pointerUp(backdrop()!, { clientX: 50, clientY: 50 });
    expect(props.onSelect.mock.calls[0][0]).toBe("#ffffff");
  });

  it("previews live while the pointer is held down", async () => {
    const { backdrop, props } = setup();
    await tick();
    await fireEvent.pointerDown(backdrop()!);
    await fireEvent.pointerMove(window, {
      clientX: 20,
      clientY: 20,
      altKey: true,
    });
    expect(props.onChange).toHaveBeenCalledWith(
      "elementBackground",
      "#121212",
      [],
      { altKey: true },
    );
  });

  it("cancels on Escape, on window blur and on an outside pointerdown", async () => {
    const { backdrop, props } = setup();
    await tick();
    await fireEvent.keyDown(backdrop()!, { key: "Escape" });
    expect(props.onCancel).toHaveBeenCalledTimes(1);

    await fireEvent.blur(window);
    expect(props.onCancel).toHaveBeenCalledTimes(2);

    await fireEvent.pointerDown(document.body);
    expect(props.onCancel).toHaveBeenCalledTimes(3);

    // clicks on the backdrop / trigger don't count as outside
    await fireEvent.pointerDown(backdrop()!);
    expect(props.onCancel).toHaveBeenCalledTimes(3);
  });

  it("removes the backdrop when unmounted", async () => {
    const { backdrop, unmount } = setup();
    await tick();
    expect(backdrop()).not.toBeNull();
    unmount();
    await tick();
    expect(backdrop()).toBeNull();
  });
});
