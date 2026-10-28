import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it } from "vitest";

import { Emitter } from "@svelte-draw/common";

import { getDefaultAppState } from "../appState";

import { getHintParts } from "./HintViewer";
import HintViewer from "./HintViewer.svelte";

import type { AppClassProperties } from "../types";

const createApp = (alt = false) => {
  const held = { alt, shift: false, ctrlOrCmd: false };
  const onChange = new Emitter<[typeof held]>();
  const app = {
    scene: { getSelectedElements: () => [] },
    modifiers: { get: () => held, onChange },
    selectionTool: { canCycleSelection: () => false },
    state: getDefaultAppState(),
    props: {},
  } as unknown as AppClassProperties;
  return { app, held, onChange };
};

const baseProps = () => {
  const { app } = createApp();
  return {
    app,
    isMobile: false,
    editorInterface: { canFitSidebar: true } as any,
    appState: {
      ...getDefaultAppState(),
      width: 100,
      height: 100,
      offsetLeft: 0,
      offsetTop: 0,
    } as any,
  };
};

describe("getHintParts", () => {
  it("splits <kbd> shortcuts from plain text", () => {
    expect(getHintParts("Press <kbd>Esc</kbd> to leave")).toEqual([
      { kbd: false, text: "Press " },
      { kbd: true, text: "Esc" },
      { kbd: false, text: " to leave" },
    ]);
  });

  it("joins an array of hints, dropping every trailing period", () => {
    expect(getHintParts(["First. ", "Second."])).toEqual([
      { kbd: false, text: "First, Second" },
    ]);
  });
});

describe("HintViewer", () => {
  it("renders the canvas panning hint with <kbd> shortcuts", () => {
    const { container } = render(HintViewer, baseProps());
    const hint = container.querySelector(".HintViewer span");
    expect(hint).not.toBeNull();
    expect(hint!.querySelectorAll("kbd").length).toBe(2);
  });

  it("renders nothing when hints are disabled", () => {
    const props = baseProps();
    props.appState.showHints = false;
    const { container } = render(HintViewer, props);
    expect(container.querySelector(".HintViewer")).toBeNull();
  });

  it("renders nothing on mobile when there is no applicable hint", () => {
    const { container } = render(HintViewer, {
      ...baseProps(),
      isMobile: true,
    });
    expect(container.querySelector(".HintViewer")).toBeNull();
  });

  it("shows the tool hint for the active tool", () => {
    const props = baseProps();
    props.appState.activeTool = { ...props.appState.activeTool, type: "text" };
    const { container } = render(HintViewer, props);
    expect(container.querySelector(".HintViewer")).not.toBeNull();
    expect(container.querySelector(".HintViewer kbd")).toBeNull();
  });

  it("reacts to the Alt modifier being held (cycle selection hint)", async () => {
    const { app, held, onChange } = createApp();
    (app.selectionTool as any).canCycleSelection = () => true;
    const props = { ...baseProps(), app };
    const { container } = render(HintViewer, props);
    expect(container.querySelectorAll(".HintViewer kbd").length).toBe(2);

    (held as any).alt = true;
    onChange.trigger({ ...held, alt: true });
    await tick();

    expect(container.querySelectorAll(".HintViewer kbd").length).toBe(1);
  });
});
