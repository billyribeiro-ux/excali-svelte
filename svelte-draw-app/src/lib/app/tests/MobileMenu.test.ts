import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { UI } from "@svelte-draw/editor/tests/helpers/ui";
import {
  mockBoundingClientRect,
  render,
  restoreOriginalGetBoundingClientRect,
} from "@svelte-draw/editor/tests/test-utils";

import MobileMenuHarness from "./MobileMenuHarness.test.svelte";

/**
 * Svelte renders anchor comments (`<!---->`) and whitespace-only text nodes
 * between blocks, which React did not. To keep comparing against the original
 * (React) snapshot, serialize a clone of the node with those framework
 * artifacts removed; every element, attribute and text node is still compared.
 *
 * The only edit to the ported snapshot: `class="welcome-screen-menu-item "`
 * (React template literal with an empty className) is now
 * `class="welcome-screen-menu-item"` (Svelte class array), in 2 places.
 */
const withoutSvelteArtifacts = (element: Element | null) => {
  const clone = element?.cloneNode(true) as Element | undefined;
  if (!clone) {
    return clone ?? null;
  }
  const walker = document.createTreeWalker(
    clone,
    NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT,
  );
  const remove: Node[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.COMMENT_NODE || !node.textContent?.trim()) {
      remove.push(node);
    }
  }
  remove.forEach((node) => node.parentNode?.removeChild(node));
  return clone;
};

describe("Test MobileMenu", () => {
  const { h } = window;
  const dimensions = { height: 400, width: 800 };

  beforeAll(() => {
    mockBoundingClientRect(dimensions);
  });

  beforeEach(async () => {
    await render(MobileMenuHarness);
    h.app.refreshEditorInterface();
  });

  afterAll(() => {
    restoreOriginalGetBoundingClientRect();
  });

  it("should set editor interface correctly", () => {
    expect(h.app.editorInterface.formFactor).toBe("phone");
  });

  it("should initialize with welcome screen and hide once user interacts", async () => {
    expect(
      withoutSvelteArtifacts(document.querySelector(".welcome-screen-center")),
    ).toMatchSnapshot();
    UI.clickTool("rectangle");
    expect(document.querySelector(".welcome-screen-center")).toBeNull();
  });
});
