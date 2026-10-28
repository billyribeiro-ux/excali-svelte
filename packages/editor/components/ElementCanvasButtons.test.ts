import { createRawSnippet, tick } from "svelte";
import { describe, expect, it } from "vitest";

import ElementCanvasButtons from "./ElementCanvasButtons.svelte";
import {
  createFakeEditorContext,
  makeElement,
  renderWithEditorContext,
} from "./overlayTestUtils";

const children = createRawSnippet(() => ({
  render: () => `<button data-testid="inner">go</button>`,
}));

const setup = (appState = {}) => {
  const element = makeElement({
    type: "rectangle",
    x: 100,
    y: 40,
    width: 50,
    height: 20,
  }) as any;
  const fake = createFakeEditorContext({
    appState: { offsetLeft: 10, offsetTop: 5, ...appState },
  });
  const view = renderWithEditorContext(
    ElementCanvasButtons,
    {
      element,
      elementsMap: new Map([[element.id, element]]) as any,
      children,
    },
    fake.ctx,
  );
  return { ...view, fake };
};

describe("ElementCanvasButtons", () => {
  it("is anchored to the top-right of the element, in editor coordinates", () => {
    const { container } = setup();
    const wrapper = container.querySelector<HTMLElement>(
      ".excalidraw-canvas-buttons",
    )!;
    // viewport x/y include the offsets, which are subtracted again:
    // x: (100 + 50) + 10, y: 40
    expect(wrapper.style.left).toBe("160px");
    expect(wrapper.style.top).toBe("40px");
    expect(wrapper.style.padding).toBe("5px");
    expect(wrapper.querySelector("[data-testid='inner']")).not.toBeNull();
  });

  it("hides while the context menu is open and returns when it closes", async () => {
    const { container, fake } = setup();
    fake.update({ contextMenu: { items: [], top: 0, left: 0 } as any });
    await tick();
    expect(container.querySelector(".excalidraw-canvas-buttons")).toBeNull();
    fake.update({ contextMenu: null });
    await tick();
    expect(container.querySelector(".excalidraw-canvas-buttons")).not.toBeNull();
  });

  it.each([
    ["isRotating", true],
    ["viewModeEnabled", true],
    ["openMenu", "canvas"],
  ])("is not rendered when %s", (key, value) => {
    const { container } = setup({ [key]: value });
    expect(container.querySelector(".excalidraw-canvas-buttons")).toBeNull();
  });
});
