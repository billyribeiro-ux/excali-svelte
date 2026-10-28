import { render } from "@testing-library/svelte";

import ExcalidrawLogo from "./ExcalidrawLogo.svelte";

describe("ExcalidrawLogo", () => {
  it("renders only the icon by default with size small", () => {
    const { container } = render(ExcalidrawLogo);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe("ExcalidrawLogo is-small");
    expect(root.querySelectorAll("svg")).toHaveLength(1);
    expect(root.querySelector("svg.ExcalidrawLogo-icon")).not.toBeNull();
    expect(root.querySelector(".ExcalidrawLogo-text")).toBeNull();
  });

  it("renders the text when withText and honours size and style", () => {
    const { container } = render(ExcalidrawLogo, {
      withText: true,
      size: "large",
      style: "color: red",
    });
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("is-large");
    expect(root.style.color).toBe("red");
    expect(root.querySelectorAll("svg")).toHaveLength(2);
    expect(root.querySelector("svg.ExcalidrawLogo-text")).not.toBeNull();
  });
});
