import { fireEvent, } from "@testing-library/svelte";
import { tick } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ARROW_TYPE } from "@svelte-draw/common";

import { editorJotaiStore } from "../editor-jotai";

import {
  CURSOR_HINT_COOLDOWN,
  CursorHints,
  cursorHintAtom,
} from "./CursorHint";
import CursorHintComponent from "./CursorHint.svelte";
import {
  createFakeEditorContext,
  renderWithEditorContext,
} from "./overlayTestUtils";
import { LineIcon } from "./icons";

const createApp = () => {
  const app: any = {
    viewport: { lastPosition: { x: 100, y: 50 } },
    state: { currentItemArrowType: ARROW_TYPE.round },
    updateEditorAtom: (atom: any, value: any) =>
      editorJotaiStore.set(atom, value),
    ownerWindow: window,
  };
  return app;
};

const getHint = () =>
  document.querySelector<HTMLElement>("[data-testid='cursor-hint']");

describe("CursorHints policy", () => {
  beforeEach(() => {
    editorJotaiStore.set(cursorHintAtom, null);
  });

  it("does not show a hint while the pointer position is unknown", () => {
    const app = createApp();
    app.viewport.lastPosition = { x: 0, y: 0 };
    new CursorHints(app).onArrowTypeCycled(ARROW_TYPE.elbow);
    expect(editorJotaiStore.peek(cursorHintAtom)).toBeNull();
  });

  it("always hints when the arrow type is cycled", () => {
    const hints = new CursorHints(createApp());
    hints.onArrowTypeCycled(ARROW_TYPE.elbow);
    const first = editorJotaiStore.peek(cursorHintAtom);
    expect(first?.content.html).toContain("<svg");
    hints.onArrowTypeCycled(ARROW_TYPE.sharp);
    expect(editorJotaiStore.peek(cursorHintAtom)?.nonce).not.toBe(
      first?.nonce,
    );
  });

  it("suppresses letter tool shortcuts during cooldown, not digit ones", () => {
    const hints = new CursorHints(createApp());
    hints.onToolShortcut("line", "letter");
    expect(editorJotaiStore.peek(cursorHintAtom)?.content).toBe(LineIcon);
    editorJotaiStore.set(cursorHintAtom, null);

    hints.onToolShortcut("line", "letter");
    expect(editorJotaiStore.peek(cursorHintAtom)).toBeNull();

    hints.onToolShortcut("line", "digit");
    expect(editorJotaiStore.peek(cursorHintAtom)).not.toBeNull();
    editorJotaiStore.set(cursorHintAtom, null);

    (hints as any).lastShownAt = Date.now() - CURSOR_HINT_COOLDOWN;
    hints.onToolShortcut("line", "letter");
    expect(editorJotaiStore.peek(cursorHintAtom)).not.toBeNull();
  });
});

describe("CursorHint component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    editorJotaiStore.set(cursorHintAtom, null);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const mount = () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.getBoundingClientRect = () =>
      ({
        left: 100,
        top: 50,
        right: 2020,
        bottom: 1130,
        width: 1920,
        height: 1080,
        x: 100,
        y: 50,
        toJSON: () => {},
      } as DOMRect);
    const { ctx } = createFakeEditorContext({
      app: createApp(),
      container: container as HTMLDivElement,
    });
    return renderWithEditorContext(CursorHintComponent, {}, ctx);
  };

  it("renders nothing without a hint", () => {
    mount();
    expect(getHint()).toBeNull();
  });

  it("shows the icon, fades out and hides on its own", async () => {
    mount();
    editorJotaiStore.set(cursorHintAtom, { content: LineIcon, nonce: 1 });
    await tick();
    expect(getHint()).not.toBeNull();
    expect(getHint()!.querySelector("svg")).not.toBeNull();
    expect(getHint()).not.toHaveClass("CursorHint--fade-out");

    await vi.advanceTimersByTimeAsync(700);
    expect(getHint()).toHaveClass("CursorHint--fade-out");

    await vi.advanceTimersByTimeAsync(100);
    expect(getHint()).toBeNull();
    expect(editorJotaiStore.peek(cursorHintAtom)).toBeNull();
  });

  it("hides immediately on pointerdown", async () => {
    mount();
    editorJotaiStore.set(cursorHintAtom, { content: LineIcon, nonce: 1 });
    await tick();
    expect(getHint()).not.toBeNull();

    await fireEvent.pointerDown(document.body);
    expect(getHint()).toBeNull();
  });

  it("tracks the pointer, offset by the gap, relative to the container", async () => {
    mount();
    editorJotaiStore.set(cursorHintAtom, { content: LineIcon, nonce: 1 });
    await tick();

    await fireEvent.pointerMove(window, { clientX: 200, clientY: 100 });
    // container-relative position, 16px offset from the pointer
    expect(getHint()!.style.transform).toBe("translate(116px, 66px)");
  });

  it("restarts the hide timer when re-triggered", async () => {
    mount();
    editorJotaiStore.set(cursorHintAtom, { content: LineIcon, nonce: 1 });
    await tick();
    await vi.advanceTimersByTimeAsync(600);
    editorJotaiStore.set(cursorHintAtom, { content: LineIcon, nonce: 2 });
    await tick();
    await vi.advanceTimersByTimeAsync(600);
    expect(getHint()).not.toBeNull();
    expect(getHint()).not.toHaveClass("CursorHint--fade-out");
    await vi.advanceTimersByTimeAsync(200);
    expect(getHint()).toBeNull();
  });
});
