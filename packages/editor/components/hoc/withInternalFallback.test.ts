import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import FallbackEditors from "./FallbackEditors.test.svelte";

const getTriggers = (root: ParentNode) =>
  root.querySelectorAll('[data-testid="main-menu-trigger"]');

const expectOneMenuPerEditor = (container: HTMLElement) => {
  expect(getTriggers(container)).toHaveLength(2);

  const excalContainers = container.querySelectorAll<HTMLDivElement>(
    ".excalidraw-container",
  );
  expect(getTriggers(excalContainers[0])).toHaveLength(1);
  expect(getTriggers(excalContainers[1])).toHaveLength(1);
};

describe("Test internal component fallback rendering", () => {
  const scenarios = [
    ["custom menu first", true, false],
    ["default menu first", false, true],
    ["two custom menus", true, true],
    ["two default menus", false, false],
  ] as const;

  it.each(scenarios)(
    "should render only one menu per editor instance (%s scenario)",
    async (_, hostA, hostB) => {
      const { container } = render(FallbackEditors, {
        ctxA: createFakeEditor().ctx,
        ctxB: createFakeEditor().ctx,
        hostA,
        hostB,
      });

      expectOneMenuPerEditor(container);
    },
  );

  it("should render only the host menu (not the fallback) when the host is declared after the fallback", async () => {
    const { container } = render(FallbackEditors, {
      ctxA: createFakeEditor().ctx,
      ctxB: createFakeEditor().ctx,
      hostA: true,
      hostB: true,
      hostAfterFallback: true,
    });

    expectOneMenuPerEditor(container);
    // the host's content (`test`) is what was teleported, not the default items
    expect(container.querySelectorAll(".excalidraw-container")).toHaveLength(2);
  });

  it("should fall back to the internal menu once the host menu is removed, and back again", async () => {
    const ctxA = createFakeEditor().ctx;
    const ctxB = createFakeEditor().ctx;
    const { container, rerender } = render(FallbackEditors, {
      ctxA,
      ctxB,
      hostA: true,
      hostB: false,
    });
    expectOneMenuPerEditor(container);

    await rerender({ ctxA, ctxB, hostA: false, hostB: false });
    expectOneMenuPerEditor(container);

    await rerender({ ctxA, ctxB, hostA: true, hostB: true });
    expectOneMenuPerEditor(container);
  });
});
