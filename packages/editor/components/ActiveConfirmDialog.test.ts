import { tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../editor-jotai";
import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import { activeConfirmDialogAtom } from "./ActiveConfirmDialog";
import ActiveConfirmDialog from "./ActiveConfirmDialog.svelte";

vi.mock("../actions", () => ({ actionClearCanvas: { name: "clearCanvas" } }));
vi.mock("./LibraryMenu", async () => {
  const { atom } = await import("../editor-jotai");
  return { isLibraryMenuOpenAtom: atom(false) };
});

afterEach(() => {
  editorJotaiStore.set(activeConfirmDialogAtom, null);
});

const renderActive = () => {
  const ctx = createFakeEditorContext();
  render(EditorContextHarness, {
    props: { component: ActiveConfirmDialog, ctx },
  });
  return ctx;
};

describe("ActiveConfirmDialog", () => {
  it("renders nothing while no dialog is active", () => {
    renderActive();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the clear canvas confirmation when the atom is set", async () => {
    renderActive();
    editorJotaiStore.set(activeConfirmDialogAtom, "clearCanvas");
    await tick();
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".Dialog__titleContent")).toHaveTextContent("Clear canvas");
    expect(dialog.querySelector(".clear-canvas__content")?.textContent).toBe(
      " This will clear the whole canvas. Are you sure?",
    );
  });

  it("confirming executes the clear canvas action and closes", async () => {
    const ctx = renderActive();
    editorJotaiStore.set(activeConfirmDialogAtom, "clearCanvas");
    await tick();
    await fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await tick();
    expect(ctx.actionManager.executeAction).toHaveBeenCalledWith({
      name: "clearCanvas",
    });
    expect(editorJotaiStore.peek(activeConfirmDialogAtom)).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancelling closes without executing the action", async () => {
    const ctx = renderActive();
    editorJotaiStore.set(activeConfirmDialogAtom, "clearCanvas");
    await tick();
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await tick();
    expect(ctx.actionManager.executeAction).not.toHaveBeenCalled();
    expect(editorJotaiStore.peek(activeConfirmDialogAtom)).toBeNull();
  });
});
