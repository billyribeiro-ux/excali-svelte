import { createRawSnippet, tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../editor-jotai";
import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import ConfirmDialog from "./ConfirmDialog.svelte";
import { isLibraryMenuOpenAtom } from "./LibraryMenu";

vi.mock("./LibraryMenu", async () => {
  const { atom } = await import("../editor-jotai");
  return { isLibraryMenuOpenAtom: atom(false) };
});

const message = createRawSnippet(() => ({
  render: () => `<p data-testid="msg">Are you sure?</p>`,
}));

const renderConfirm = async (props: Record<string, unknown> = {}) => {
  const ctx = createFakeEditorContext();
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(EditorContextHarness, {
    props: {
      component: ConfirmDialog,
      ctx,
      props: { title: "Sure?", onConfirm, onCancel, children: message, ...props },
    },
  });
  await tick();
  return { ctx, onConfirm, onCancel };
};

describe("ConfirmDialog", () => {
  it("renders a small confirm dialog with default button texts", async () => {
    await renderConfirm({ class: "mine" });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("Dialog", "confirm-dialog", "mine");
    expect(
      (dialog.querySelector(".Modal__content") as HTMLElement).style.getPropertyValue(
        "--max-width",
      ),
    ).toBe("550px");
    expect(screen.getByTestId("msg")).toBeInTheDocument();
    const buttons = dialog.querySelectorAll(".confirm-dialog-buttons button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute("aria-label", "Cancel");
    expect(buttons[1]).toHaveAttribute("aria-label", "Confirm");
    expect(buttons[1]).toHaveClass("Dialog__action-button--danger");
  });

  it("uses custom button texts", async () => {
    await renderConfirm({ confirmText: "Yes", cancelText: "No" });
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
  });

  it("confirm closes menus, runs onConfirm and focuses the container", async () => {
    editorJotaiStore.set(isLibraryMenuOpenAtom, true);
    const { ctx, onConfirm, onCancel } = await renderConfirm();
    const focus = vi.spyOn(ctx.container!, "focus");
    await fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(ctx.setAppState).toHaveBeenCalledWith({ openMenu: null });
    expect(editorJotaiStore.peek(isLibraryMenuOpenAtom)).toBe(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
  });

  it("cancel runs onCancel and focuses the container", async () => {
    const { ctx, onConfirm, onCancel } = await renderConfirm();
    const focus = vi.spyOn(ctx.container!, "focus");
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
  });

  it("Escape cancels", async () => {
    const { onCancel } = await renderConfirm();
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
