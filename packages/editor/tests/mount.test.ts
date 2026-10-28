import { describe, expect, it } from "vitest";

import SvelteDraw from "../components/SvelteDraw.svelte";

import { GlobalTestState, render, unmountComponent } from "./test-utils";

describe("<Excalidraw> (Svelte)", () => {
  it("mounts the editor with both canvases and an initialized app", async () => {
    await render(SvelteDraw, { props: {} });

    expect(GlobalTestState.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(GlobalTestState.interactiveCanvas).toBeInstanceOf(HTMLCanvasElement);

    const { h } = window;
    expect(h.app).toBeTruthy();
    expect(h.state.isLoading).toBe(false);
    expect(h.elements).toEqual([]);

    unmountComponent();
  });
});
