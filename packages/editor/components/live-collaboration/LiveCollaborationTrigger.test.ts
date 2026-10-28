import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";
import EditorContextHarness from "../../ui/EditorContextHarness.test.svelte";

import LiveCollaborationTrigger from "./LiveCollaborationTrigger.svelte";

import type { EditorInterface } from "@svelte-draw/common";

const desktop = { formFactor: "desktop" } as EditorInterface;

const renderTrigger = (
  editor: ReturnType<typeof createFakeEditor>,
  props: Record<string, unknown>,
) =>
  render(EditorContextHarness, {
    props: { ctx: editor.ctx, component: LiveCollaborationTrigger, props },
  });

describe("LiveCollaborationTrigger", () => {
  it("shows the share label on wide desktop screens and reports selection", async () => {
    const onSelect = vi.fn();
    const editor = createFakeEditor({ appState: { width: 1920 } });
    const { container } = renderTrigger(editor, {
      isCollaborating: false,
      onSelect,
      editorInterface: desktop,
    });

    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveClass("excalidraw-button", "collab-button");
    expect(button).not.toHaveClass("active");
    expect(button).toHaveAttribute("title", "Live collaboration...");
    expect(button).toHaveTextContent("Share");
    expect(button.querySelector("svg")).toBeNull();
    expect(button.style.width).toBe("auto");
    expect(button.style.position).toBe("relative");

    await fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("shows only the icon on narrow screens and non-desktop form factors", () => {
    const narrow = createFakeEditor({ appState: { width: 500 } });
    const first = renderTrigger(narrow, {
      isCollaborating: true,
      onSelect: () => {},
      editorInterface: desktop,
    });
    const button = first.container.querySelector("button")!;
    expect(button).toHaveClass("active");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button).not.toHaveTextContent("Share");
    expect(button.style.width).toBe("");
    first.unmount();

    const wide = createFakeEditor({ appState: { width: 1920 } });
    const second = renderTrigger(wide, {
      isCollaborating: false,
      onSelect: () => {},
      editorInterface: { formFactor: "tablet" } as EditorInterface,
    });
    expect(second.container.querySelector("svg")).not.toBeNull();
  });

  it("shows the number of collaborators", () => {
    const editor = createFakeEditor({
      appState: {
        width: 1920,
        collaborators: new Map([
          ["a" as any, { socketId: "a" as any }],
          ["b" as any, { socketId: "b" as any }],
        ]),
      },
    });
    const { container } = renderTrigger(editor, {
      isCollaborating: true,
      onSelect: () => {},
      editorInterface: desktop,
    });
    expect(container.querySelector(".CollabButton-collaborators")).toHaveTextContent(
      "2",
    );
  });

  it("forwards extra attributes to the button", () => {
    const editor = createFakeEditor({ appState: { width: 1920 } });
    const { container } = renderTrigger(editor, {
      isCollaborating: false,
      onSelect: () => {},
      editorInterface: desktop,
      "data-testid": "collab-trigger",
    });
    expect(container.querySelector("button")).toHaveAttribute(
      "data-testid",
      "collab-trigger",
    );
  });
});
