import { mount, unmount, flushSync } from "svelte";
import { describe, expect, it } from "vitest";

import { portal } from "./portal";

// an attachment is a plain function of the element, so it can be called directly
const runAttachment = (target: HTMLElement | (() => HTMLElement)) => {
  const element = document.createElement("div");
  element.id = "portaled";
  const origin = document.createElement("section");
  origin.appendChild(element);
  document.body.appendChild(origin);
  const cleanup = portal(target)(element) as () => void;
  return { element, origin, cleanup };
};

describe("portal", () => {
  it("moves the element into the target and removes it on cleanup", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const { element, origin, cleanup } = runAttachment(target);

    expect(element.parentElement).toBe(target);
    expect(origin.contains(element)).toBe(false);

    cleanup();
    expect(element.isConnected).toBe(false);
    expect(target.children).toHaveLength(0);
    target.remove();
    origin.remove();
  });

  it("resolves a function target when the attachment runs", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const { element, cleanup } = runAttachment(() => target);
    expect(target.firstElementChild).toBe(element);
    cleanup();
    target.remove();
  });
});

describe("portal inside a component", () => {
  it("is applied through {@attach} and torn down with the component", async () => {
    const { default: Harness } = await import("./PortalHarness.test.svelte");
    const target = document.createElement("div");
    document.body.appendChild(target);
    const component = mount(Harness, { target: document.body, props: { to: target } });
    flushSync();

    expect(target.querySelector(".portaled")).not.toBeNull();

    unmount(component);
    flushSync();
    expect(target.querySelector(".portaled")).toBeNull();
    target.remove();
  });
});
