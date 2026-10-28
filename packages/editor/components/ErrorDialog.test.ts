import { createRawSnippet, tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import ErrorDialog from "./ErrorDialog.svelte";

vi.mock("./LibraryMenu", async () => {
  const { atom } = await import("../editor-jotai");
  return { isLibraryMenuOpenAtom: atom(false) };
});

const renderError = async (props: Record<string, unknown>) => {
  const ctx = createFakeEditorContext();
  render(EditorContextHarness, {
    props: { component: ErrorDialog, ctx, props },
  });
  await tick();
  return ctx;
};

describe("ErrorDialog", () => {
  it("renders nothing without a message", async () => {
    await renderError({});
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a string message in a small, pre-wrapped dialog", async () => {
    await renderError({ content: "line1\nline2" });
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector(".Dialog__titleContent")).toHaveTextContent("Error");
    const wrapper = dialog.querySelector(".Dialog__content > div") as HTMLElement;
    expect(wrapper.style.whiteSpace).toBe("pre-wrap");
    expect(wrapper).toHaveTextContent("line1 line2");
  });

  it("renders snippet and component messages", async () => {
    const snippet = createRawSnippet(() => ({ render: () => "<b>boom</b>" }));
    await renderError({ content: snippet });
    expect(screen.getByRole("dialog").querySelector("b")).toHaveTextContent("boom");
  });

  it("renders inline children", async () => {
    const children = createRawSnippet(() => ({ render: () => "<i>inline</i>" }));
    await renderError({ children });
    expect(screen.getByRole("dialog").querySelector("i")).toHaveTextContent("inline");
  });

  it("closes, notifies and focuses the editor container", async () => {
    const onClose = vi.fn();
    const ctx = await renderError({ content: "oops", onClose });
    const focus = vi.spyOn(ctx.container!, "focus");
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await tick();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
