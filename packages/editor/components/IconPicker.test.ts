import { fireEvent, waitFor } from "@testing-library/svelte";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../editor-jotai";

import IconPicker from "./IconPicker.svelte";
import { moreOptionsAtom } from "./IconPicker";
import {
  createFakeEditorContext,
  renderWithEditorContext,
} from "./overlayTestUtils";

import type { Option, PickerSection } from "./IconPicker";

const icon = (id: string) => ({
  html: `<svg data-icon="${id}" viewBox="0 0 1 1"></svg>`,
});

const option = (
  value: string,
  keyBinding: string | null = null,
): Option<string> => ({
  value,
  text: `Option ${value}`,
  icon: icon(value),
  keyBinding,
});

const visibleSections: PickerSection<string>[] = [
  {
    name: "default",
    options: [
      option("a", "a"),
      option("b", "b"),
      option("c", "c"),
      option("d", "d"),
      option("e", "e"),
    ],
  },
];

const hiddenSections: PickerSection<string>[] = [
  { name: "More", options: [option("f", "f")] },
];

beforeAll(() => {
  (globalThis as any).ResizeObserver ||= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const setup = (props: Record<string, unknown> = {}) => {
  const { ctx } = createFakeEditorContext();
  const onChange = vi.fn();
  const view = renderWithEditorContext(
    IconPicker as any,
    {
      label: "Pick one",
      value: "a",
      visibleSections,
      onChange,
      ...props,
    },
    ctx,
  );
  const trigger = view.getByRole("button", { name: "Pick one" });
  const open = async () => {
    await fireEvent.click(trigger);
    return waitFor(() => {
      const dialog = document.querySelector<HTMLElement>(".picker")!;
      expect(dialog).not.toBeNull();
      return dialog;
    });
  };
  return { ...view, onChange, trigger, open };
};

describe("IconPicker", () => {
  beforeEach(() => {
    editorJotaiStore.set(moreOptionsAtom, false);
  });

  it("shows the icon of the selected option in the trigger", () => {
    const { trigger } = setup({ value: "b" });
    expect(trigger.querySelector('svg[data-icon="b"]')).not.toBeNull();
    expect(trigger).not.toHaveClass("active");
  });

  it("falls back to the hidden sections to find the selected option", () => {
    const { trigger } = setup({ value: "f", hiddenSections });
    expect(trigger.querySelector('svg[data-icon="f"]')).not.toBeNull();
  });

  it("opens a labelled dialog listing the options and marks the active one", async () => {
    const { trigger, open } = setup({ value: "b" });
    const dialog = await open();

    expect(trigger).toHaveClass("active");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Pick one");
    expect(dialog.querySelectorAll(".picker-option")).toHaveLength(5);
    expect(dialog.querySelector(".picker-option.active")).toHaveAttribute(
      "aria-label",
      "Option b",
    );
    const first = dialog.querySelector(".picker-option")!;
    expect(first).toHaveAttribute("title", "Option a — A");
    expect(first).toHaveAttribute("aria-keyshortcuts", "a");
    expect(first.querySelector(".picker-keybinding")).toHaveTextContent("a");
  });

  it("focuses the active option", async () => {
    const { open } = setup({ value: "c" });
    const dialog = await open();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        dialog.querySelector(".picker-option.active"),
      ),
    );
  });

  it("changes the value on click", async () => {
    const { open, onChange } = setup();
    const dialog = await open();
    await fireEvent.click(dialog.querySelectorAll(".picker-option")[2]);
    expect(onChange).toHaveBeenCalledWith("c");
  });

  it("changes the value with the option's key binding", async () => {
    const { open, onChange } = setup();
    const dialog = await open();
    await fireEvent.keyDown(dialog, { key: "D" });
    expect(onChange).toHaveBeenCalledWith("d");
  });

  it("ignores key bindings with modifiers", async () => {
    const { open, onChange } = setup();
    const dialog = await open();
    await fireEvent.keyDown(dialog, { key: "d", ctrlKey: true });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("navigates with the arrow keys, wrapping around", async () => {
    const { open, onChange } = setup({ value: "e" });
    const dialog = await open();
    await fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("a");
    await fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("d");
  });

  it("navigates rows with ArrowDown / ArrowUp (4 columns)", async () => {
    const { open, onChange, rerender } = setup({ value: "a" });
    const dialog = await open();
    // row 0: a b c d, row 1: e
    await fireEvent.keyDown(dialog, { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith("e");

    await rerender({ value: "e" });
    await fireEvent.keyDown(dialog, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith("a");
  });

  it("cycles with Tab and Shift+Tab", async () => {
    const { open, onChange } = setup({ value: "a" });
    const dialog = await open();
    await fireEvent.keyDown(dialog, { key: "Tab" });
    expect(onChange).toHaveBeenLastCalledWith("b");
    await fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith("e");
  });

  it("closes on Escape and Enter, without changing the value", async () => {
    const { open, onChange, trigger } = setup();
    let dialog = await open();
    await fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(document.querySelector(".picker")).toBeNull());
    expect(trigger).not.toHaveClass("active");

    dialog = await open();
    await fireEvent.keyDown(dialog, { key: "Enter" });
    await waitFor(() => expect(document.querySelector(".picker")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not let handled keys bubble out of the dialog", async () => {
    const { open } = setup();
    const dialog = await open();
    const outer = vi.fn();
    document.body.addEventListener("keydown", outer);
    await fireEvent.keyDown(dialog, { key: "ArrowRight" });
    await fireEvent.keyDown(dialog, { key: "x" });
    expect(outer).not.toHaveBeenCalled();
    document.body.removeEventListener("keydown", outer);
  });

  describe("hidden sections", () => {
    it("are collapsed until the more options header is toggled", async () => {
      const { open } = setup({ hiddenSections });
      const dialog = await open();
      expect(dialog.querySelectorAll(".picker-option")).toHaveLength(5);
      expect(dialog.querySelector(".picker-section-label")).toBeNull();

      await fireEvent.click(
        dialog.querySelector<HTMLElement>(".picker-collapsible")!,
      );
      await waitFor(() =>
        expect(dialog.querySelectorAll(".picker-option")).toHaveLength(6),
      );
      expect(dialog.querySelector(".picker-section-label")).toHaveTextContent(
        "More",
      );
    });

    it("expand automatically when the value is a hidden option", async () => {
      const { open } = setup({ hiddenSections, value: "f" });
      const dialog = await open();
      await waitFor(() =>
        expect(dialog.querySelectorAll(".picker-option")).toHaveLength(6),
      );
    });

    it("are part of the keyboard navigation", async () => {
      const { open, onChange } = setup({ hiddenSections, value: "e" });
      const dialog = await open();
      await fireEvent.keyDown(dialog, { key: "ArrowRight" });
      expect(onChange).toHaveBeenLastCalledWith("f");
    });
  });
});
