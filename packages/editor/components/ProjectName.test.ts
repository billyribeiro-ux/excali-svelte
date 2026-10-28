import { tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import ProjectName from "./ProjectName.svelte";

const renderName = (props: Record<string, unknown> = {}) => {
  const onChange = vi.fn();
  const ctx = createFakeEditorContext();
  render(EditorContextHarness, {
    props: {
      component: ProjectName,
      ctx,
      props: { value: "Untitled", label: "Name", onChange, ...props },
    },
  });
  return { onChange, ctx };
};

describe("ProjectName", () => {
  it("renders the label and a text input with the editor-scoped id", () => {
    renderName();
    const label = document.querySelector("label.ProjectName-label") as HTMLElement;
    expect(label).toHaveTextContent("Name:");
    expect(label).toHaveAttribute("for", "filename");
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveClass("TextInput");
    expect(input).toHaveAttribute("id", "test-editor-filename");
    expect(input.value).toBe("Untitled");
  });

  it("reports the new value on blur only when it changed", async () => {
    const { onChange } = renderName();
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.input(input, { target: { value: "Drawing" } });
    await fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith("Drawing");
  });

  it("blurs on Enter (committing the value) but not while composing", async () => {
    const { onChange } = renderName();
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    await fireEvent.input(input, { target: { value: "Typed" } });

    await fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(document.activeElement).toBe(input);

    await fireEvent.keyDown(input, { key: "Enter" });
    await tick();
    expect(document.activeElement).not.toBe(input);
    expect(onChange).toHaveBeenCalledWith("Typed");
  });

  it("moves focus to the nearest focusable parent on blur unless ignoreFocus", async () => {
    const wrapper = document.createElement("div");
    wrapper.tabIndex = 0;
    document.body.appendChild(wrapper);
    const ctx = createFakeEditorContext();
    render(EditorContextHarness, {
      target: wrapper,
      props: {
        component: ProjectName,
        ctx,
        props: { value: "a", label: "Name", onChange: () => {} },
      },
    });
    const input = wrapper.querySelector("input") as HTMLInputElement;
    input.focus();
    await fireEvent.blur(input);
    expect(document.activeElement).toBe(wrapper);
    wrapper.remove();
  });
});
