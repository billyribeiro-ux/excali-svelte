import { render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VERSIONS } from "@svelte-draw/common";

import LibraryMenuBrowseButton from "./LibraryMenuBrowseButton.svelte";

describe("LibraryMenuBrowseButton", () => {
  // the button only exists when a library site is configured
  beforeEach(() => vi.stubEnv("VITE_APP_LIBRARY_URL", "https://libraries.example.test"));
  afterEach(() => vi.unstubAllEnvs());

  it("is not rendered when VITE_APP_LIBRARY_URL is unset (no default site)", () => {
    vi.stubEnv("VITE_APP_LIBRARY_URL", "");
    const { container } = render(LibraryMenuBrowseButton, {
      id: "abc",
      theme: "dark",
      libraryReturnUrl: undefined,
    });
    expect(container.querySelector("a")).toBeNull();
  });

  it("links to the libraries site with token, theme, version and referrer", () => {
    render(LibraryMenuBrowseButton, {
      id: "abc",
      theme: "dark",
      libraryReturnUrl: "https://host.example/return",
    });
    const link = screen.getByRole("link");
    expect(link).toHaveClass("library-menu-browse-button");
    expect(link).toHaveAttribute("target", "_excalidraw_libraries");
    const href = link.getAttribute("href")!;
    expect(href.startsWith("https://libraries.example.test?target=")).toBe(true);
    expect(href).toContain("referrer=https://host.example/return");
    expect(href).toContain("token=abc");
    expect(href).toContain("theme=dark");
    expect(href).toContain(`version=${VERSIONS.excalidrawLibrary}`);
    expect(href).toContain("useHash=true");
  });

  it("falls back to the current location as referrer", () => {
    render(LibraryMenuBrowseButton, {
      id: "abc",
      theme: "light",
      libraryReturnUrl: undefined,
    });
    const href = screen.getByRole("link").getAttribute("href")!;
    expect(href).toContain(
      `referrer=${window.location.origin + window.location.pathname}`,
    );
  });
});
