import { createRawSnippet } from "svelte";
import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import Island from "./Island.svelte";

const content = createRawSnippet(() => ({ render: () => "<p>inside</p>" }));

describe("Island", () => {
  it("renders the Island class, children and padding custom property", () => {
    const { container } = render(Island, { padding: 4, children: content });
    const island = container.querySelector(".Island") as HTMLElement;
    expect(island).not.toBeNull();
    expect(island.style.getPropertyValue("--padding")).toBe("4");
    expect(island.querySelector("p")).toHaveTextContent("inside");
  });

  it("forwards viewport-ui data attributes and extra classes", () => {
    const { container } = render(Island, {
      class: "zen-mode",
      "data-viewport-ui": "left",
      "data-viewport-ui-name": "toolbar",
      children: content,
    } as any);
    const island = container.querySelector(".Island") as HTMLElement;
    expect(island).toHaveClass("zen-mode");
    expect(island.dataset.viewportUi).toBe("left");
    expect(island.dataset.viewportUiName).toBe("toolbar");
  });
});
