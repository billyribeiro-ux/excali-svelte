import { render as svelteRender } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, waitFor } from "@svelte-draw/editor/tests/test-utils";

import AppComponentsHarness from "./AppComponentsHarness.test.svelte";
import TopErrorBoundaryHarness from "./TopErrorBoundaryHarness.test.svelte";

describe("app UI components", () => {
  it("renders the app main menu, welcome screen and footer inside <Excalidraw>", async () => {
    const onCollabDialogOpen = vi.fn();
    await render(AppComponentsHarness, { props: { onCollabDialogOpen } });

    // welcome screen: heading + collab trigger + sign-up link
    expect(document.querySelector(".welcome-screen-center")).not.toBeNull();
    expect(
      document.querySelector(".welcome-screen-center__heading")?.textContent,
    ).toMatch(/.+/);

    // footer: encrypted icon
    const encrypted = document.querySelector<HTMLAnchorElement>(
      "a.encrypted-icon.tooltip",
    );
    expect(encrypted).not.toBeNull();
    expect(encrypted!.getAttribute("rel")).toBe("noopener");

    // main menu content (the trigger is in the layer UI)
    fireEvent.click(document.querySelector(".dropdown-menu-button")!);
    await waitFor(() =>
      expect(document.querySelector(".dropdown-select__language")).not.toBeNull(),
    );
    expect(
      document.querySelector("[data-testid='collab-button']"),
    ).not.toBeNull();
    expect(
      document.querySelector("[data-testid='command-palette-button']"),
    ).not.toBeNull();
  });

  it("TopErrorBoundary shows the error splash when a child throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = svelteRender(TopErrorBoundaryHarness);

    await waitFor(() =>
      expect(container.querySelector(".ErrorSplash")).not.toBeNull(),
    );
    expect(container.querySelectorAll(".ErrorSplash-paragraph button")).toHaveLength(3);
    expect(
      container
        .querySelector(".ErrorSplash-details textarea")
        ?.hasAttribute("readonly"),
    ).toBe(true);
    consoleError.mockRestore();
  });
});
