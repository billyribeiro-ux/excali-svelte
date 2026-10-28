import { createRawSnippet, tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import Modal from "./Modal.svelte";

const content = createRawSnippet(() => ({
  render: () => `<p data-testid="content">inside</p>`,
}));

const renderModal = async (
  props: Record<string, unknown> = {},
  ctxOverrides: Parameters<typeof createFakeEditorContext>[0] = {},
) => {
  const ctx = createFakeEditorContext(ctxOverrides);
  const result = render(EditorContextHarness, {
    props: {
      component: Modal,
      ctx,
      props: {
        onCloseRequest: vi.fn(),
        labelledBy: "title-id",
        children: content,
        ...props,
      },
    },
  });
  await tick();
  return { ctx, ...result };
};

afterEach(() => {
  document.body.className = "";
});

describe("Modal", () => {
  it("portals the dialog into an excalidraw container on body", async () => {
    const { container } = await renderModal({ class: "Custom", maxWidth: 500 });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "title-id");
    expect(dialog).toHaveClass("Modal", "Custom");
    expect(dialog).not.toHaveClass("animations-disabled");

    const root = dialog.parentElement as HTMLElement;
    expect(root.parentElement).toBe(document.body);
    expect(root).toHaveClass("excalidraw", "excalidraw-modal-container");
    expect(container.contains(dialog)).toBe(false);

    const contentEl = dialog.querySelector(".Modal__content") as HTMLElement;
    expect(contentEl).toHaveAttribute("tabindex", "0");
    expect(contentEl.style.getPropertyValue("--max-width")).toBe("500px");
    expect(screen.getByTestId("content")).toHaveTextContent("inside");
  });

  it("adds the mobile and dark theme classes to the container", async () => {
    await renderModal(
      {},
      {
        editorInterface: { formFactor: "phone" },
        appState: { theme: "dark", width: 1, height: 1 },
      },
    );
    const root = screen.getByRole("dialog").parentElement as HTMLElement;
    expect(root).toHaveClass("excalidraw--mobile", "theme--dark");
  });

  it("marks animations disabled from the body class", async () => {
    document.body.classList.add("excalidraw-animations-disabled");
    await renderModal();
    expect(screen.getByRole("dialog")).toHaveClass("animations-disabled");
  });

  it("requests close on Escape and stops the event from propagating", async () => {
    const onCloseRequest = vi.fn();
    await renderModal({ onCloseRequest });
    const documentListener = vi.fn();
    document.addEventListener("keydown", documentListener);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    screen.getByRole("dialog").dispatchEvent(event);

    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(documentListener).not.toHaveBeenCalled();
    document.removeEventListener("keydown", documentListener);
  });

  it("ignores other keys", async () => {
    const onCloseRequest = vi.fn();
    await renderModal({ onCloseRequest });
    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "a" });
    expect(onCloseRequest).not.toHaveBeenCalled();
  });

  it("closes on background click unless closeOnClickOutside is false", async () => {
    const onCloseRequest = vi.fn();
    await renderModal({ onCloseRequest });
    await fireEvent.click(document.querySelector(".Modal__background")!);
    expect(onCloseRequest).toHaveBeenCalledTimes(1);
  });

  it("does not close on background click when closeOnClickOutside is false", async () => {
    const onCloseRequest = vi.fn();
    await renderModal({ onCloseRequest, closeOnClickOutside: false });
    await fireEvent.click(document.querySelector(".Modal__background")!);
    expect(onCloseRequest).not.toHaveBeenCalled();
  });

  it("removes the portal container when unmounted", async () => {
    const { unmount } = await renderModal();
    expect(document.querySelector(".excalidraw-modal-container")).not.toBeNull();
    unmount();
    expect(document.querySelector(".excalidraw-modal-container")).toBeNull();
  });

  it("prevents the browser from opening files dropped on the modal", async () => {
    await renderModal();
    const root = screen.getByRole("dialog").parentElement as HTMLElement;
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    const dataTransfer = { types: ["Files"], dropEffect: "copy" };
    Object.defineProperty(drop, "dataTransfer", { value: dataTransfer });
    root.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
    expect(dataTransfer.dropEffect).toBe("none");
  });
});
