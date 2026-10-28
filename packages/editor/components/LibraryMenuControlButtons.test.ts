import { createRawSnippet } from "svelte";
import { render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LibraryMenuControlButtons from "./LibraryMenuControlButtons.svelte";

describe("LibraryMenuControlButtons", () => {
  beforeEach(() => vi.stubEnv("VITE_APP_LIBRARY_URL", "https://libraries.example.test"));
  afterEach(() => vi.unstubAllEnvs());

  it("renders the browse button, extra children, class and style", () => {
    const { container } = render(LibraryMenuControlButtons, {
      id: "abc",
      theme: "light",
      libraryReturnUrl: undefined,
      style: "padding: 16px 0",
      class: "extra-class",
      children: createRawSnippet(() => ({
        render: () => `<button data-testid="extra">more</button>`,
      })),
    });
    const root = container.querySelector(".library-menu-control-buttons")!;
    expect(root).toHaveClass("extra-class");
    expect(root).toHaveStyle({ padding: "16px 0px" });
    expect(root.querySelector("a.library-menu-browse-button")).not.toBeNull();
    expect(screen.getByTestId("extra")).toBeInTheDocument();
  });
});
