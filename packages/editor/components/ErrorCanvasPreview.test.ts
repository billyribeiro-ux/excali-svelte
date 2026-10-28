import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import ErrorCanvasPreview from "./ErrorCanvasPreview.svelte";

describe("ErrorCanvasPreview", () => {
  it("renders the translated canvas-too-big messages", () => {
    const { container } = render(ErrorCanvasPreview);
    expect(container.querySelector("h3")).toHaveTextContent(
      "Cannot show preview",
    );
    expect(container.querySelector("span")).toHaveTextContent(
      "The canvas may be too big",
    );
    expect(container.querySelector("em")?.textContent).toMatch(/^\(.+\)$/);
  });
});
