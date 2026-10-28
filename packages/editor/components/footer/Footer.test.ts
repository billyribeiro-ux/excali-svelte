import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { CLASSES } from "@svelte-draw/common";

import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import FooterHarness from "./FooterHarness.test.svelte";

vi.mock("../../actions", () => ({
  actionShortcuts: { name: "toggleShortcuts" },
  actionToggleZenMode: { name: "zenMode" },
}));

describe("Footer", () => {
  it("renders zoom/undo-redo sections, the help button and the exit zen mode button", async () => {
    const { ctx, executeAction } = createFakeEditor();
    const { container } = render(FooterHarness, { ctx });

    const footer = container.querySelector("footer")!;
    expect(footer).toHaveAttribute("role", "contentinfo");
    expect(footer).toHaveClass(
      "layer-ui__wrapper__footer",
      "App-menu",
      "App-menu_bottom",
    );
    expect(
      footer.querySelector(
        ".layer-ui__wrapper__footer-left.zen-mode-transition .Stack_vertical section[aria-labelledby='test-editor-canvasActions-title']",
      ),
    ).not.toBeNull();
    expect(footer.querySelector(".undo-redo-buttons")).not.toBeNull();
    expect(footer.querySelector(`.${CLASSES.ZOOM_ACTIONS}`)).not.toBeNull();

    const help = footer.querySelector<HTMLElement>(".help-icon")!;
    expect(help).toHaveAttribute("aria-label", "Help");
    await fireEvent.click(help);
    expect(executeAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "toggleShortcuts" }),
    );

    const exit = footer.querySelector<HTMLElement>(".disable-zen-mode")!;
    expect(exit).not.toHaveClass("disable-zen-mode--visible");
  });

  it("shows the exit zen mode button and transitions the right section in zen mode", () => {
    const { ctx } = createFakeEditor({ appState: { zenModeEnabled: true } });
    const { container } = render(FooterHarness, {
      ctx,
      showExitZenModeBtn: true,
    });

    expect(container.querySelector(".disable-zen-mode")).toHaveClass(
      "disable-zen-mode--visible",
    );
    expect(
      container.querySelector(".layer-ui__wrapper__footer-right"),
    ).toHaveClass("transition-right");
    expect(container.querySelector(".undo-redo-buttons")).toHaveClass(
      "layer-ui__wrapper__footer-left--transition-bottom",
    );
  });

  it("hides undo/redo in view mode and everything default when the default UI is off", () => {
    const viewMode = createFakeEditor({ appState: { viewModeEnabled: true } });
    const first = render(FooterHarness, { ctx: viewMode.ctx });
    expect(first.container.querySelector(".undo-redo-buttons")).toBeNull();
    first.unmount();

    const { ctx } = createFakeEditor();
    const { container } = render(FooterHarness, {
      ctx,
      defaultUIEnabled: false,
      zoomUIEnabled: false,
    });
    expect(container.querySelector(".layer-ui__wrapper__footer-left")).toBeNull();
    expect(container.querySelector(".layer-ui__wrapper__footer-right")).toBeNull();
    expect(container.querySelector(".help-icon")).toBeNull();
    expect(container.querySelector(".disable-zen-mode")).toBeNull();
  });

  it("keeps the zoom controls but drops the rest when only zoom UI is enabled", () => {
    const { ctx } = createFakeEditor();
    const { container } = render(FooterHarness, {
      ctx,
      defaultUIEnabled: false,
      zoomUIEnabled: true,
    });
    expect(container.querySelector(".layer-ui__wrapper__footer-left")).not.toBeNull();
    expect(container.querySelector(".undo-redo-buttons")).toBeNull();
  });

  it("renders the welcome screen help hint next to the help button", () => {
    const { ctx } = createFakeEditor();
    const { container } = render(FooterHarness, {
      ctx,
      renderWelcomeScreen: true,
    });
    const right = container.querySelector(".layer-ui__wrapper__footer-right")!;
    expect(right.querySelector(".welcome-screen-decor-hint--help")).toHaveTextContent(
      "help hint",
    );
    expect(right.querySelector(".help-icon")).not.toBeNull();
  });

  it("teleports host <Footer> content into the center of the footer", () => {
    const { ctx } = createFakeEditor({ appState: { zenModeEnabled: true } });
    const { container } = render(FooterHarness, { ctx, hostCenter: true });

    const center = container.querySelector("footer .footer-center")!;
    expect(center).toHaveClass(
      "zen-mode-transition",
      "layer-ui__wrapper__footer-left--transition-bottom",
    );
    expect(center.querySelector("#host-footer")).toHaveTextContent("host footer");
  });
});
