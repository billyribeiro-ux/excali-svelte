import { createRawSnippet, tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../editor-jotai";
import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import { getDialogSize } from "./Dialog";
import Dialog from "./Dialog.svelte";
import { isLibraryMenuOpenAtom } from "./LibraryMenu";

vi.mock("./LibraryMenu", async () => {
  const { atom } = await import("../editor-jotai");
  return { isLibraryMenuOpenAtom: atom(false) };
});

const body = createRawSnippet(() => ({
  render: () =>
    `<div><button data-testid="first">first</button><button data-testid="last">last</button></div>`,
}));

const renderDialog = async (
  props: Record<string, unknown> = {},
  ctxOverrides: Parameters<typeof createFakeEditorContext>[0] = {},
) => {
  const ctx = createFakeEditorContext(ctxOverrides);
  const onCloseRequest = vi.fn();
  const result = render(EditorContextHarness, {
    props: {
      component: Dialog,
      ctx,
      props: { title: "My title", onCloseRequest, children: body, ...props },
    },
  });
  await tick();
  return { ctx, onCloseRequest, ...result };
};

describe("getDialogSize", () => {
  it("maps names and numbers to widths", () => {
    expect(getDialogSize("small")).toBe(550);
    expect(getDialogSize("wide")).toBe(1024);
    expect(getDialogSize("regular")).toBe(800);
    expect(getDialogSize(undefined)).toBe(800);
    expect(getDialogSize(640)).toBe(640);
  });
});

describe("Dialog", () => {
  it("renders the modal, island, title and content", async () => {
    await renderDialog({ class: "extra", size: "small" });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("Modal", "Dialog", "extra");
    expect(dialog).not.toHaveClass("Dialog--fullscreen");
    expect(dialog.querySelector(".Modal__content")).toBeInstanceOf(HTMLElement);
    expect(
      (dialog.querySelector(".Modal__content") as HTMLElement).style.getPropertyValue(
        "--max-width",
      ),
    ).toBe("550px");
    expect(dialog.querySelector(".Island")).not.toBeNull();
    const title = dialog.querySelector("h2.Dialog__title") as HTMLElement;
    expect(title).toHaveAttribute("id", "test-editor-dialog-title");
    expect(title.querySelector(".Dialog__titleContent")).toHaveTextContent("My title");
    expect(dialog.querySelector(".Dialog__content")).toContainElement(
      screen.getByTestId("first"),
    );
    expect(dialog.querySelector(".Dialog__close")).toBeNull();
  });

  it("omits the title when it is false and supports snippet titles", async () => {
    const { unmount } = await renderDialog({ title: false });
    expect(document.querySelector(".Dialog__title")).toBeNull();
    unmount();

    const title = createRawSnippet(() => ({ render: () => "<em>fancy</em>" }));
    await renderDialog({ title });
    expect(document.querySelector(".Dialog__titleContent em")).toHaveTextContent("fancy");
  });

  it("autofocuses the first non-close focusable element", async () => {
    vi.useFakeTimers();
    try {
      await renderDialog();
      await vi.advanceTimersByTimeAsync(0);
      // [0] is the first button; [1] is the second one, which wins like React
      expect(document.activeElement).toBe(screen.getByTestId("last"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not autofocus when autofocus is false", async () => {
    vi.useFakeTimers();
    try {
      await renderDialog({ autofocus: false });
      await vi.advanceTimersByTimeAsync(0);
      expect(document.activeElement).not.toBe(screen.getByTestId("last"));
      expect(document.activeElement).not.toBe(screen.getByTestId("first"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("wraps Tab focus at both ends", async () => {
    await renderDialog({ autofocus: false });
    const first = screen.getByTestId("first");
    const last = screen.getByTestId("last");

    last.focus();
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    const shiftTab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(shiftTab);
    expect(document.activeElement).toBe(last);
  });

  it("on close resets menus, restores focus and requests close", async () => {
    const previous = document.createElement("button");
    document.body.appendChild(previous);
    previous.focus();
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);

    const { ctx, onCloseRequest } = await renderDialog();
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(ctx.setAppState).toHaveBeenCalledWith({ openMenu: null });
    expect(editorJotaiStore.peek(isLibraryMenuOpenAtom)).toBe(false);
    expect(document.activeElement).toBe(previous);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    previous.remove();
  });

  it("renders a close button on phones", async () => {
    const { onCloseRequest } = await renderDialog(
      {},
      { editorInterface: { formFactor: "phone" } },
    );
    expect(screen.getByRole("dialog")).toHaveClass("Dialog--fullscreen");
    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveClass("Dialog__close");
    expect(close.querySelector("svg")).not.toBeNull();
    await fireEvent.click(close);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
  });
});
