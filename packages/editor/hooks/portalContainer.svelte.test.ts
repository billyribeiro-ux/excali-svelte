import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vitest";

import { createFakeEditorContext } from "../ui/testEditorContext";

// `getEditorContext` needs a component context, so the hook is exercised
// through a tiny harness component
import PortalContainerHarness from "./PortalContainerHarness.test.svelte";

describe("createPortalContainer", () => {
  it("appends a styled div to the owner document body and removes it on destroy", () => {
    const ctx = createFakeEditorContext();
    const seen: { div: HTMLDivElement | null }[] = [];
    const component = mount(PortalContainerHarness, {
      target: document.body,
      props: { ctx, opts: { className: "a  b" }, onDiv: (d: any) => seen.push(d) },
    });
    flushSync();
    const div = document.body.querySelector("div.excalidraw.a.b") as HTMLDivElement;
    expect(div).not.toBeNull();
    expect(div.parentElement).toBe(document.body);
    expect(div).not.toHaveClass("theme--dark", "excalidraw--mobile");
    unmount(component);
    flushSync();
    expect(div.isConnected).toBe(false);
  });

  it("appends inside the parentSelector within the editor container", () => {
    const ctx = createFakeEditorContext();
    const parent = document.createElement("div");
    parent.className = "layer";
    ctx.container!.appendChild(parent);
    const component = mount(PortalContainerHarness, {
      target: document.body,
      props: { ctx, opts: { parentSelector: ".layer", className: "c" } },
    });
    flushSync();
    expect(parent.querySelector("div.excalidraw.c")).not.toBeNull();
    unmount(component);
  });

  it("follows the theme and form factor", () => {
    const ctx = createFakeEditorContext({
      appState: { theme: "dark", width: 1, height: 1 },
      editorInterface: { formFactor: "phone" },
    });
    const component = mount(PortalContainerHarness, {
      target: document.body,
      props: { ctx, opts: { className: "x" } },
    });
    flushSync();
    const div = document.body.querySelector("div.excalidraw.x") as HTMLDivElement;
    expect(div).toHaveClass("theme--dark", "excalidraw--mobile");
    unmount(component);
  });
});
