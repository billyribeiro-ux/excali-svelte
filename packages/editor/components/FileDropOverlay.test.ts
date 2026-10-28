import { tick } from "svelte";
import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import { MIME_TYPES } from "@svelte-draw/common";

import Harness from "./DialogContextHarness.test.svelte";
import FileDropOverlay from "./FileDropOverlay.svelte";

import type { EditorContextValue } from "../ui/editorContext";

// jsdom has no DragEvent constructor. MouseEvent supplies the coordinates and
// modifier keys, and the data store models files being protected until drop.
const drag = (
  target: Element | Document,
  type: string,
  {
    files = [],
    types = ["Files"],
    ...init
  }: MouseEventInit & { files?: File[]; types?: string[] } = {},
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 200,
    clientY: 200,
    ...init,
  });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      dropEffect: "none",
      types,
      files: type === "drop" ? files : [],
      items: files.map((file) => ({
        kind: "file",
        type: file.type,
        getAsFile: () => (type === "drop" ? file : null),
      })),
    },
  });
  fireEvent(target, event);
  return event as MouseEvent & { dataTransfer: { dropEffect: string } };
};

const setup = async () => {
  const container = document.createElement("div");
  const child = document.createElement("canvas");
  container.appendChild(child);
  document.body.appendChild(container);
  const ctx = {
    app: { ownerDocument: document, ownerWindow: window },
    container,
  } as unknown as EditorContextValue;
  render(Harness, { component: FileDropOverlay, ctx });
  const overlay = () => document.querySelector(".file-drop-overlay");
  // let the listener-registering effect run
  await tick();
  return { container, child, overlay };
};

describe("FileDropOverlay", () => {
  it("ignores text and library-item drags, and stays visible across child boundaries", async () => {
    const { container, child, overlay } = await setup();

    for (const type of [MIME_TYPES.text, MIME_TYPES.excalidrawlibIds]) {
      drag(child, "dragenter", { types: [type] });
      expect(overlay()).toBeNull();
    }

    drag(container, "dragenter");
    await tick();
    expect(overlay()?.textContent).toContain("Drop to replace content");
    drag(child, "dragenter");
    drag(container, "dragleave");
    await tick();
    expect(overlay()).not.toBeNull();
    drag(child, "dragleave");
    await tick();
    expect(overlay()).toBeNull();
  });

  it("updates when Shift changes through drag events or keyboard events", async () => {
    const { child, overlay } = await setup();
    drag(child, "dragenter", { shiftKey: true });
    await tick();
    expect(overlay()?.textContent).toContain("Drop to add to canvas");

    const event = drag(child, "dragover", { shiftKey: false });
    expect(event.dataTransfer.dropEffect).toBe("copy");
    await tick();
    expect(overlay()?.textContent).toContain("Drop to replace content");
    expect(overlay()?.querySelector("kbd")?.textContent).toBe("Shift");

    fireEvent.keyDown(document, { key: "Shift", shiftKey: true });
    await tick();
    expect(overlay()?.textContent).toContain(
      "Your existing content will be kept",
    );
    expect(overlay()).toHaveClass("file-drop-overlay--keep");
    fireEvent.keyUp(document, { key: "Shift", shiftKey: false });
    await tick();
    expect(overlay()?.textContent).toContain("Drop to replace content");
  });

  it.each(["drop", "dragend", "Escape", "blur"])(
    "clears on %s and can show again for the next drag",
    async (type) => {
      const { child, overlay } = await setup();
      drag(child, "dragenter");
      await tick();
      expect(overlay()).not.toBeNull();

      if (type === "Escape") {
        fireEvent.keyDown(document, { key: "Escape" });
      } else if (type === "blur") {
        fireEvent.blur(window);
      } else {
        drag(document.body, type);
      }
      await tick();
      expect(overlay()).toBeNull();
      drag(child, "dragenter");
      await tick();
      expect(overlay()).not.toBeNull();
      drag(child, "dragleave");
      await tick();
      expect(overlay()).toBeNull();
    },
  );

  it.each([
    [MIME_TYPES.jpg],
    [MIME_TYPES.png],
    [MIME_TYPES.svg],
    ["image/tiff"],
    [MIME_TYPES.json, MIME_TYPES.jpg],
  ])("keeps the canvas visible for image drags: %s", async (...types) => {
    const { child, overlay } = await setup();
    const files = types.map((type) => new File([], "file", { type }));

    drag(child, "dragenter", { files });
    await tick();
    expect(overlay()).toBeNull();

    // A later scene drag must still show the overlay.
    drag(child, "dragleave", { files });
    drag(child, "dragenter");
    await tick();
    expect(overlay()?.textContent).toContain("Drop to replace content");
  });

  it("describes library imports without reading protected files", async () => {
    const { child, overlay } = await setup();
    const file = new File([], "file", { type: MIME_TYPES.excalidrawlib });
    drag(child, "dragenter", { files: [file] });
    await tick();
    expect(overlay()?.textContent).toContain("Drop to import library");
  });

  it("mentions libraries when the file type is unknown", async () => {
    const { child, overlay } = await setup();
    const untyped = new File([], "file", { type: "" });
    drag(child, "dragenter", { files: [untyped] });
    await tick();
    expect(overlay()?.textContent).toContain("Library files will append");
    drag(child, "dragleave");

    const json = new File([], "file", { type: MIME_TYPES.json });
    drag(child, "dragenter", { files: [json] });
    await tick();
    expect(overlay()?.textContent).not.toContain("Library files");
  });
});
