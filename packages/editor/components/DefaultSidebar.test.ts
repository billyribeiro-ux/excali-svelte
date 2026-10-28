import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SIDEBAR } from "@svelte-draw/common";

import SidebarHarness from "./Sidebar/SidebarHarness.test.svelte";
import { assertSidebarDockButton } from "./Sidebar/siderbar.test.helpers";
import { createFakeEditor } from "./testing/fakeEditor.test.helpers.svelte";

// the library / search menus are heavy editor internals, not under test here
vi.mock("./LibraryMenu.svelte", async () => ({
  default: (await import("./testing/Noop.test.svelte")).default,
}));
vi.mock("./SearchMenu.svelte", async () => ({
  default: (await import("./testing/Noop.test.svelte")).default,
}));

const renderDefaultSidebar = async (
  defaultProps: Record<string, unknown> = {},
  appState: Record<string, unknown> = {},
) => {
  const editor = createFakeEditor({
    appState: { openSidebar: { name: DEFAULT_SIDEBAR.name }, ...appState },
  });
  const result = render(SidebarHarness, {
    ctx: editor.ctx,
    scenario: "default",
    defaultProps,
  });
  await waitFor(() => {
    expect(result.container.querySelector(".sidebar")).not.toBe(null);
  });
  return { ...result, ...editor };
};

describe("DefaultSidebar", () => {
  it("when `docked={undefined}` & `onDock={undefined}`, should allow docking", async () => {
    const { container, getAppState } = await renderDefaultSidebar();
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    const { dockButton } = await assertSidebarDockButton(container, true);

    await fireEvent.click(dockButton);
    await waitFor(() => {
      expect(getAppState().defaultSidebarDockedPreference).toBe(true);
      expect(dockButton).toHaveClass("selected");
    });

    await fireEvent.click(dockButton);
    await waitFor(() => {
      expect(getAppState().defaultSidebarDockedPreference).toBe(false);
      expect(dockButton).not.toHaveClass("selected");
    });
  });

  it("when `docked={undefined}` & `onDock`, should allow docking", async () => {
    const onDock = vi.fn();
    const { container, getAppState } = await renderDefaultSidebar({ onDock });
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    const { dockButton } = await assertSidebarDockButton(container, true);

    await fireEvent.click(dockButton);
    await waitFor(() => {
      expect(getAppState().defaultSidebarDockedPreference).toBe(true);
      expect(dockButton).toHaveClass("selected");
    });
    // the host's `onDock` is composed with the default behavior
    expect(onDock).toHaveBeenCalledWith(true);

    await fireEvent.click(dockButton);
    await waitFor(() => {
      expect(getAppState().defaultSidebarDockedPreference).toBe(false);
      expect(dockButton).not.toHaveClass("selected");
    });
    expect(onDock).toHaveBeenLastCalledWith(false);
  });

  it("when `docked={true}` & `onDock`, should allow docking", async () => {
    const { container, getAppState } = await renderDefaultSidebar({
      onDock: () => {},
    });
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    const { dockButton } = await assertSidebarDockButton(container, true);

    await fireEvent.click(dockButton);
    await waitFor(() => {
      expect(getAppState().defaultSidebarDockedPreference).toBe(true);
      expect(dockButton).toHaveClass("selected");
    });

    await fireEvent.click(dockButton);
    await waitFor(() => {
      expect(getAppState().defaultSidebarDockedPreference).toBe(false);
      expect(dockButton).not.toHaveClass("selected");
    });
  });

  it("when `onDock={false}`, should disable docking", async () => {
    const { container, getAppState } = await renderDefaultSidebar({
      onDock: false,
    });
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    await assertSidebarDockButton(container, false);
  });

  it("when `docked={true}` & `onDock={false}`, should force-dock sidebar", async () => {
    const { container, getAppState } = await renderDefaultSidebar({
      docked: true,
      onDock: false,
    });
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    const { sidebar } = await assertSidebarDockButton(container, false);
    expect(sidebar).toHaveClass("sidebar--docked");
  });

  it("when `docked={true}` & `onDock={undefined}`, should force-dock sidebar", async () => {
    const { container, getAppState } = await renderDefaultSidebar({
      docked: true,
    });
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    const { sidebar } = await assertSidebarDockButton(container, false);
    expect(sidebar).toHaveClass("sidebar--docked");
  });

  it("when `docked={false}` & `onDock={undefined}`, should force-undock sidebar", async () => {
    const { container, getAppState } = await renderDefaultSidebar({
      docked: false,
    });
    expect(getAppState().defaultSidebarDockedPreference).toBe(false);

    const { sidebar } = await assertSidebarDockButton(container, false);
    expect(sidebar).not.toHaveClass("sidebar--docked");
  });

  it("is force-docked (and not user-dockable) on the search tab", async () => {
    const { container } = await renderDefaultSidebar(
      {},
      { openSidebar: { name: DEFAULT_SIDEBAR.name, tab: "search" } },
    );

    const { sidebar } = await assertSidebarDockButton(container, false);
    expect(sidebar).toHaveClass("sidebar--docked");
  });

  it("renders the search and library tab triggers and the active tab only", async () => {
    const { container } = await renderDefaultSidebar(
      {},
      { openSidebar: { name: DEFAULT_SIDEBAR.name, tab: "library" } },
    );

    expect(container.querySelectorAll(".sidebar-tab-trigger")).toHaveLength(2);
    expect(
      container.querySelector('[role="tabpanel"][data-testid="library"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[role="tabpanel"][data-testid="search"]'),
    ).toBeNull();
  });
});
