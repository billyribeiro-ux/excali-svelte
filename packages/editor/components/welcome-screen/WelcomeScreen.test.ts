import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import WelcomeScreenHarness from "./WelcomeScreenHarness.test.svelte";

vi.mock("../../actions", () => ({
  actionLoadScene: { name: "loadScene" },
  actionShortcuts: { name: "toggleShortcuts" },
}));

const out = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

describe("WelcomeScreen", () => {
  it("renders the default center and hints into their tunnel outlets", () => {
    const { ctx } = createFakeEditor();
    const { container } = render(WelcomeScreenHarness, { ctx });

    const center = out(container, "center-out").querySelector(
      ".welcome-screen-center",
    )!;
    expect(center).not.toBeNull();
    expect(
      center.querySelector(".welcome-screen-center__logo .ExcalidrawLogo"),
    ).not.toBeNull();
    expect(
      center.querySelector(".welcome-screen-center__heading"),
    ).toHaveTextContent(/.+/);
    expect(
      center.querySelectorAll(".welcome-screen-menu .welcome-screen-menu-item"),
    ).toHaveLength(2);

    expect(
      out(container, "menu-hint-out").querySelector(
        ".welcome-screen-decor-hint--menu svg",
      ),
    ).not.toBeNull();
    expect(
      out(container, "toolbar-hint-out").querySelector(
        ".welcome-screen-decor-hint--toolbar svg",
      ),
    ).not.toBeNull();
    expect(
      out(container, "help-hint-out").querySelector(
        ".welcome-screen-decor-hint--help svg",
      ),
    ).not.toBeNull();
    for (const hint of container.querySelectorAll(
      ".welcome-screen-decor-hint__label",
    )) {
      expect(hint).toHaveTextContent(/.+/);
    }
  });

  it("hides the load item in view mode and runs the default menu actions", async () => {
    const { ctx, executeAction } = createFakeEditor();
    const { container, unmount } = render(WelcomeScreenHarness, { ctx });

    const items = container.querySelectorAll<HTMLElement>(
      ".welcome-screen-menu-item",
    );
    await fireEvent.click(items[0]);
    expect(executeAction).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "loadScene" }),
    );
    await fireEvent.click(items[1]);
    expect(executeAction).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "toggleShortcuts" }),
    );
    expect(items[1].querySelector(".welcome-screen-menu-item__shortcut")).toHaveTextContent(
      "?",
    );
    unmount();

    const viewMode = createFakeEditor({ appState: { viewModeEnabled: true } });
    const second = render(WelcomeScreenHarness, { ctx: viewMode.ctx });
    expect(
      second.container.querySelectorAll(".welcome-screen-menu-item"),
    ).toHaveLength(1);
  });

  it("teleports host-declared center content and hints in place of the defaults", async () => {
    const onLiveCollab = vi.fn();
    const { ctx } = createFakeEditor();
    const { container } = render(WelcomeScreenHarness, {
      ctx,
      custom: true,
      onLiveCollab,
    });

    const center = out(container, "center-out");
    expect(center.querySelector(".welcome-screen-center__logo")).toHaveTextContent(
      "my logo",
    );
    expect(
      center.querySelector(".welcome-screen-center__heading"),
    ).toHaveTextContent("my heading");
    // no default logo svg
    expect(center.querySelector(".ExcalidrawLogo")).toBeNull();

    const link = center.querySelector<HTMLAnchorElement>("a.welcome-screen-menu-item")!;
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");

    const collab = [
      ...center.querySelectorAll<HTMLElement>("button.welcome-screen-menu-item"),
    ].at(-1)!;
    expect(collab.querySelector(".welcome-screen-menu-item__shortcut")).toBeNull();
    await fireEvent.click(collab);
    expect(onLiveCollab).toHaveBeenCalledTimes(1);

    expect(out(container, "menu-hint-out")).toHaveTextContent("my menu hint");
    expect(out(container, "toolbar-hint-out")).toHaveTextContent("my toolbar hint");
    expect(out(container, "help-hint-out")).toHaveTextContent("my help hint");
  });

  it("omits menu item shortcuts on phones", () => {
    const { ctx } = createFakeEditor({ editorInterface: { formFactor: "phone" } });
    const { container } = render(WelcomeScreenHarness, { ctx });
    expect(container.querySelector(".welcome-screen-menu-item__shortcut")).toBeNull();
  });
});
