import { flushSync } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTextEditorFocus,
  restoreCaretPosition,
  saveCaretPosition,
  temporarilyDisableTextEditorBlur,
  withCaretPositionPreservation,
} from "./textEditorFocus.svelte";

let editor: HTMLTextAreaElement;

beforeEach(() => {
  vi.useFakeTimers();
  editor = document.createElement("textarea");
  editor.className = "excalidraw-wysiwyg";
  editor.value = "hello world";
  document.body.appendChild(editor);
  editor.setSelectionRange(2, 5);
});

afterEach(() => {
  editor.remove();
  vi.useRealTimers();
});

describe("caret helpers", () => {
  it("saves the selection of the text editor, or null without one", () => {
    expect(saveCaretPosition()).toEqual({ start: 2, end: 5 });
    editor.remove();
    expect(saveCaretPosition()).toBeNull();
  });

  it("restores focus and selection asynchronously", () => {
    editor.setSelectionRange(0, 0);
    restoreCaretPosition({ start: 1, end: 4 });
    expect(document.activeElement).not.toBe(editor);
    vi.advanceTimersByTime(0);
    expect(document.activeElement).toBe(editor);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([1, 4]);
  });

  it("withCaretPositionPreservation saves, runs and restores only in compact mode while editing", () => {
    const callback = vi.fn(() => editor.setSelectionRange(0, 0));
    const onPreventClose = vi.fn();
    withCaretPositionPreservation(callback, true, true, onPreventClose);
    expect(onPreventClose).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(0);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 5]);

    editor.setSelectionRange(0, 0);
    withCaretPositionPreservation(callback, false, true, onPreventClose);
    vi.advanceTimersByTime(0);
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([0, 0]);
    expect(onPreventClose).toHaveBeenCalledTimes(1);
  });

  it("temporarilyDisableTextEditorBlur removes onblur for the duration", () => {
    const onblur = vi.fn();
    editor.onblur = onblur;
    temporarilyDisableTextEditorBlur(document, 100);
    expect(editor.onblur).toBeNull();
    vi.advanceTimersByTime(100);
    expect(editor.onblur).toBe(onblur);
  });
});

describe("createTextEditorFocus", () => {
  it("tracks a saved position reactively and restores then clears it", () => {
    let focus!: ReturnType<typeof createTextEditorFocus>;
    const seen: boolean[] = [];
    const destroy = $effect.root(() => {
      focus = createTextEditorFocus();
      $effect(() => {
        seen.push(focus.hasSavedPosition);
      });
    });
    flushSync();
    expect(seen).toEqual([false]);

    focus.saveCaretPosition();
    flushSync();
    expect(focus.hasSavedPosition).toBe(true);

    editor.setSelectionRange(0, 0);
    focus.restoreCaretPosition();
    vi.advanceTimersByTime(0);
    flushSync();
    expect([editor.selectionStart, editor.selectionEnd]).toEqual([2, 5]);
    expect(focus.hasSavedPosition).toBe(false);
    expect(seen).toEqual([false, true, false]);
    destroy();
  });

  it("clearSavedPosition forgets the position", () => {
    let focus!: ReturnType<typeof createTextEditorFocus>;
    const destroy = $effect.root(() => {
      focus = createTextEditorFocus(() => document);
    });
    focus.saveCaretPosition();
    focus.clearSavedPosition();
    expect(focus.hasSavedPosition).toBe(false);
    destroy();
  });
});
