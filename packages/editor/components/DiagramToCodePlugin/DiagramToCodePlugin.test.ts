import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { makeDialogCtx } from "../dialogTestUtils";
import Harness from "../DialogContextHarness.test.svelte";

import DiagramToCodePlugin from "./DiagramToCodePlugin.svelte";

describe("<DiagramToCodePlugin />", () => {
  it("registers the generate callback as the diagramToCode plugin", () => {
    const setPlugins = vi.fn();
    const generate = vi.fn();
    render(Harness, {
      component: DiagramToCodePlugin,
      componentProps: { generate },
      ctx: makeDialogCtx({ app: { setPlugins } }),
    });
    expect(setPlugins).toHaveBeenCalledWith({ diagramToCode: { generate } });
  });

  it("re-registers when the callback changes", async () => {
    const setPlugins = vi.fn();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Harness, {
      component: DiagramToCodePlugin,
      componentProps: { generate: first },
      ctx: makeDialogCtx({ app: { setPlugins } }),
    });
    await rerender({ component: DiagramToCodePlugin, componentProps: { generate: second } });
    expect(setPlugins).toHaveBeenLastCalledWith({
      diagramToCode: { generate: second },
    });
  });
});
