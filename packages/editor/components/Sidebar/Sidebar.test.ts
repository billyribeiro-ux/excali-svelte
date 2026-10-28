import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { flushSync } from "svelte";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SIDEBAR } from "@svelte-draw/common";

import { editorJotaiStore } from "../../editor-jotai";
import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import { isSidebarDockedAtom } from "./Sidebar";
import SidebarHarness from "./SidebarHarness.test.svelte";
import { assertSidebarDockButton } from "./siderbar.test.helpers";

// the library / search menus are heavy editor internals, not under test here
vi.mock("../LibraryMenu.svelte", async () => ({
  default: (await import("../testing/Noop.test.svelte")).default,
}));
vi.mock("../SearchMenu.svelte", async () => ({
  default: (await import("../testing/Noop.test.svelte")).default,
}));

const customSidebarAppState = { openSidebar: { name: "customSidebar" } };

describe("Sidebar", () => {
  describe("General behavior", () => {
    it("should render custom sidebar", async () => {
      const { ctx } = createFakeEditor({ appState: customSidebarAppState });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "content",
      });

      await waitFor(() => {
        const node = container.querySelector("#test-sidebar-content");
        expect(node).not.toBe(null);
      });
    });

    it("should render only one sidebar and prefer the custom one", async () => {
      const { ctx } = createFakeEditor({ appState: customSidebarAppState });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "content",
        defaultFallback: true,
      });

      await waitFor(() => {
        // make sure the custom sidebar is rendered
        const node = container.querySelector("#test-sidebar-content");
        expect(node).not.toBe(null);

        // make sure only one sidebar is rendered
        const sidebars = container.querySelectorAll(".sidebar");
        expect(sidebars.length).toBe(1);
      });
    });

    it("should toggle sidebar using toggleSidebar()", async () => {
      const { ctx, toggleSidebar } = createFakeEditor();
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "content",
        defaultFallback: true,
      });

      const queryContent = () =>
        container.querySelector("#test-sidebar-content");

      // sidebar isn't rendered initially
      // ---------------------------------------------------------------------
      await waitFor(() => {
        expect(queryContent()).toBe(null);
      });

      // toggle sidebar on
      // ---------------------------------------------------------------------
      expect(toggleSidebar({ name: "customSidebar" })).toBe(true);

      await waitFor(() => {
        expect(queryContent()).not.toBe(null);
      });

      // toggle sidebar off
      // ---------------------------------------------------------------------
      expect(toggleSidebar({ name: "customSidebar" })).toBe(false);

      await waitFor(() => {
        expect(queryContent()).toBe(null);
      });

      // force-toggle sidebar off (=> still hidden)
      // ---------------------------------------------------------------------
      expect(toggleSidebar({ name: "customSidebar", force: false })).toBe(
        false,
      );

      await waitFor(() => {
        expect(queryContent()).toBe(null);
      });

      // force-toggle sidebar on
      // ---------------------------------------------------------------------
      expect(toggleSidebar({ name: "customSidebar", force: true })).toBe(true);
      expect(toggleSidebar({ name: "customSidebar", force: true })).toBe(true);

      await waitFor(() => {
        expect(queryContent()).not.toBe(null);
      });

      // toggle library (= hide custom sidebar)
      // ---------------------------------------------------------------------
      expect(toggleSidebar({ name: DEFAULT_SIDEBAR.name })).toBe(true);

      await waitFor(() => {
        expect(queryContent()).toBe(null);

        // make sure only one sidebar is rendered
        const sidebars = container.querySelectorAll(".sidebar");
        expect(sidebars.length).toBe(1);
      });

      // closing sidebar using `{ name: null }`
      // ---------------------------------------------------------------------
      expect(toggleSidebar({ name: "customSidebar" })).toBe(true);
      await waitFor(() => {
        expect(queryContent()).not.toBe(null);
      });

      expect(toggleSidebar({ name: null })).toBe(false);
      await waitFor(() => {
        expect(queryContent()).toBe(null);
      });
    });
  });

  describe("<Sidebar.Header/>", () => {
    it("should render custom sidebar header", async () => {
      const { ctx } = createFakeEditor({ appState: customSidebarAppState });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header-custom",
      });

      await waitFor(() => {
        const node = container.querySelector("#test-sidebar-header-content");
        expect(node).not.toBe(null);
      });
      // make sure we don't render the default fallback header,
      // just the custom one
      expect(
        container.querySelectorAll('[data-testid="sidebar-header"]').length,
      ).toBe(1);
    });

    it("should not render <Sidebar.Header> for custom sidebars by default", async () => {
      const { ctx } = createFakeEditor({ appState: customSidebarAppState });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "plain",
        className: "test-sidebar",
      });

      await waitFor(() => {
        expect(container.querySelector(".test-sidebar")).not.toBe(null);
      });
      const sidebar = container.querySelector<HTMLElement>(".test-sidebar")!;
      const closeButton = sidebar.querySelector(
        '[data-testid="sidebar-close"]',
      );
      expect(closeButton).toBe(null);
    });

    it("<Sidebar.Header> should render close button", async () => {
      const onStateChange = vi.fn();
      // (the React test got the initial open through `initialData`, which is
      // applied after the first render; here the sidebar is opened after mount)
      const { ctx, setAppState } = createFakeEditor();
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header",
        className: "test-sidebar",
        onStateChange,
      });

      setAppState({ openSidebar: { name: "customSidebar" } });
      await waitFor(() => {
        expect(container.querySelector(".test-sidebar")).not.toBe(null);
      });

      // initial open
      expect(onStateChange).toHaveBeenCalledWith({ name: "customSidebar" });

      const sidebar = container.querySelector<HTMLElement>(".test-sidebar")!;
      const closeButton = sidebar.querySelector<HTMLElement>(
        '[data-testid="sidebar-close"]',
      )!;
      expect(closeButton).not.toBe(null);

      await fireEvent.click(closeButton);
      await waitFor(() => {
        expect(container.querySelector<HTMLElement>(".test-sidebar")).toBe(
          null,
        );
        expect(onStateChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe("Docking behavior", () => {
    const renderHeaderSidebar = async (
      props: { docked?: boolean; onDock?: () => void } = {},
    ) => {
      const { ctx } = createFakeEditor({ appState: customSidebarAppState });
      const result = render(SidebarHarness, {
        ctx,
        scenario: "header",
        className: "test-sidebar",
        ...props,
      });
      await waitFor(() => {
        expect(result.container.querySelector(".sidebar")).not.toBe(null);
      });
      return result;
    };

    it("shouldn't be user-dockable if `onDock` not supplied", async () => {
      const { container } = await renderHeaderSidebar();
      await assertSidebarDockButton(container, false);
    });

    it("shouldn't be user-dockable if `onDock` not supplied & `docked={true}`", async () => {
      const { container } = await renderHeaderSidebar({ docked: true });
      await assertSidebarDockButton(container, false);
    });

    it("shouldn't be user-dockable if `onDock` not supplied & docked={false}`", async () => {
      const { container } = await renderHeaderSidebar({ docked: false });
      await assertSidebarDockButton(container, false);
    });

    it("should be user-dockable when both `onDock` and `docked` supplied", async () => {
      const onDock = vi.fn();
      const { container } = await renderHeaderSidebar({
        onDock,
        docked: true,
      });
      const { dockButton, sidebar } = await assertSidebarDockButton(
        container,
        true,
      );
      expect(sidebar).toHaveClass("sidebar--docked");

      // the button reflects the docked state and asks the host to toggle it
      expect(dockButton).toHaveClass("selected");
      await fireEvent.click(dockButton);
      expect(onDock).toHaveBeenCalledWith(false);
    });

    it("shouldn't be user-dockable when only `onDock` supplied w/o `docked`", async () => {
      // we expect warnings in this test and don't want to pollute stdout
      const mock = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { container } = await renderHeaderSidebar({ onDock: () => {} });
      await assertSidebarDockButton(container, false);

      mock.mockRestore();
    });

    it("hides the dock button when the viewport can't fit the sidebar", async () => {
      const { ctx } = createFakeEditor({
        appState: customSidebarAppState,
        editorInterface: { canFitSidebar: false },
      });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header",
        onDock: () => {},
        docked: true,
      });
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).not.toBe(null);
      });
      await assertSidebarDockButton(container, false);
    });

    it("flags the docked state in `isSidebarDockedAtom` while rendered", async () => {
      const { ctx, setAppState } = createFakeEditor({
        appState: customSidebarAppState,
      });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header",
        docked: true,
      });
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).not.toBe(null);
      });
      expect(editorJotaiStore.peek(isSidebarDockedAtom)).toBe(true);

      setAppState({ openSidebar: null });
      flushSync();
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).toBe(null);
        expect(editorJotaiStore.peek(isSidebarDockedAtom)).toBe(false);
      });
    });
  });

  describe("closing", () => {
    it("closes an undocked sidebar on Escape and on outside pointer down", async () => {
      const { ctx, getAppState, toggleSidebar } = createFakeEditor({
        appState: customSidebarAppState,
      });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header",
      });
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).not.toBe(null);
      });

      await fireEvent.keyDown(document, { key: "Escape" });
      expect(getAppState().openSidebar).toBe(null);

      toggleSidebar({ name: "customSidebar" });
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).not.toBe(null);
      });
      await fireEvent.pointerDown(document.body);
      expect(getAppState().openSidebar).toBe(null);
    });

    it("keeps a docked sidebar open on Escape / outside click when it fits", async () => {
      const { ctx, getAppState } = createFakeEditor({
        appState: customSidebarAppState,
      });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header",
        docked: true,
      });
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).not.toBe(null);
      });

      await fireEvent.keyDown(document, { key: "Escape" });
      await fireEvent.pointerDown(document.body);
      expect(getAppState().openSidebar).toEqual({ name: "customSidebar" });
    });

    it("doesn't close while a dialog is open", async () => {
      const { ctx, getAppState } = createFakeEditor({
        appState: customSidebarAppState,
      });
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "header",
      });
      await waitFor(() => {
        expect(container.querySelector(".sidebar")).not.toBe(null);
      });

      const dialog = document.body.appendChild(document.createElement("div"));
      dialog.className = "Dialog";
      await fireEvent.keyDown(document, { key: "Escape" });
      expect(getAppState().openSidebar).toEqual({ name: "customSidebar" });
      dialog.remove();
    });
  });

  describe("Sidebar.tab", () => {
    it("should toggle sidebars tabs correctly", async () => {
      const { ctx, toggleSidebar } = createFakeEditor();
      const { container } = render(SidebarHarness, {
        ctx,
        scenario: "tabs",
        name: "custom",
        docked: true,
      });

      const queryPanel = (tab: string) =>
        container.querySelector<HTMLElement>(
          `[role=tabpanel][data-testid=${tab}]`,
        );

      expect(queryPanel("library")).toBeNull();

      // open library sidebar
      expect(toggleSidebar({ name: "custom", tab: "library" })).toBe(true);
      await waitFor(() => expect(queryPanel("library")).not.toBeNull());

      // switch to comments tab
      expect(toggleSidebar({ name: "custom", tab: "comments" })).toBe(true);
      await waitFor(() => expect(queryPanel("comments")).not.toBeNull());
      // only the active tab's panel is mounted
      expect(queryPanel("library")).toBeNull();

      // toggle sidebar closed
      expect(toggleSidebar({ name: "custom", tab: "comments" })).toBe(false);
      await waitFor(() => expect(queryPanel("comments")).toBeNull());

      // toggle sidebar open
      expect(toggleSidebar({ name: "custom", tab: "comments" })).toBe(true);
      await waitFor(() => expect(queryPanel("comments")).not.toBeNull());
    });
  });
});
