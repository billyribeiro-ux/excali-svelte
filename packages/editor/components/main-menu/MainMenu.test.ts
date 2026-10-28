import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../../editor-jotai";
import { activeConfirmDialogAtom } from "../ActiveConfirmDialog";
import { overwriteConfirmStateAtom } from "../OverwriteConfirm/OverwriteConfirmState";
import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import MainMenuHarness from "./MainMenuHarness.test.svelte";

// The real action modules pull in the whole editor action tree; the menu only
// needs their identity (`name`), so stand-ins keep this test focused.
vi.mock("../../actions", () => {
  const names = {
    actionClearCanvas: "clearCanvas",
    actionLoadScene: "loadScene",
    actionSaveToActiveFile: "saveToActiveFile",
    actionSaveFileToDisk: "saveFileToDisk",
    actionShortcuts: "toggleShortcuts",
    actionToggleArrowBinding: "toggleArrowBinding",
    actionToggleGridMode: "gridMode",
    actionToggleMidpointSnapping: "toggleMidpointSnapping",
    actionToggleObjectsSnapMode: "objectsSnapMode",
    actionToggleSearchMenu: "searchMenu",
    actionToggleShowHints: "toggleShowHints",
    actionToggleStats: "stats",
    actionToggleTheme: "toggleTheme",
    actionToggleZenMode: "zenMode",
  };
  return Object.fromEntries(
    Object.entries(names).map(([key, name]) => [key, { name }]),
  );
});
vi.mock("../../actions/actionToggleViewMode", () => ({
  actionToggleViewMode: { name: "viewMode" },
}));
vi.mock("../../actions/actionExport", () => ({
  actionChangeExportEmbedScene: { name: "changeExportEmbedScene" },
}));

const open = (extra: Record<string, unknown> = {}) =>
  createFakeEditor({ appState: { openMenu: "canvas" }, ...extra });

const byTestId = (container: HTMLElement, id: string) =>
  container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

describe("MainMenu", () => {
  beforeEach(() => {
    editorJotaiStore.set(overwriteConfirmStateAtom, { active: false });
    editorJotaiStore.set(activeConfirmDialogAtom, null);
  });

  it("teleports the trigger into the outlet and toggles the menu through app state", async () => {
    const { ctx, getAppState, setAppState } = createFakeEditor();
    const { container } = render(MainMenuHarness, { ctx });

    const trigger = byTestId(container, "main-menu-trigger")!;
    expect(trigger).toHaveClass("main-menu-trigger", "dropdown-menu-button");
    expect(trigger.closest('[data-testid="outlet"]')).not.toBeNull();
    expect(byTestId(container, "dropdown-menu")).toBeNull();

    await fireEvent.click(trigger);
    expect(setAppState).toHaveBeenCalledWith({
      openMenu: "canvas",
      openPopup: null,
      openDialog: null,
    });
    expect(getAppState().openMenu).toBe("canvas");

    await waitFor(() =>
      expect(byTestId(container, "dropdown-menu")).not.toBeNull(),
    );
    const menu = byTestId(container, "dropdown-menu")!;
    expect(menu).toHaveClass("dropdown-menu", "main-menu");
    expect(menu.closest('[data-testid="outlet"]')).not.toBeNull();

    await fireEvent.click(trigger);
    expect(getAppState().openMenu).toBe(null);
    await waitFor(() => expect(byTestId(container, "dropdown-menu")).toBeNull());
  });

  it("renders host-declared items and default items inside the menu", async () => {
    const { ctx } = open();
    const { container } = render(MainMenuHarness, { ctx });

    await waitFor(() =>
      expect(byTestId(container, "dropdown-menu")).not.toBeNull(),
    );
    for (const id of [
      "load-button",
      "save-button",
      "json-export-button",
      "image-export-button",
      "command-palette-button",
      "search-menu-button",
      "help-menu-item",
      "clear-canvas-button",
      "toggle-dark-mode",
      "canvas-background-label",
      "custom-item",
    ]) {
      expect(byTestId(container, id), id).not.toBeNull();
    }
    expect(container.querySelector(".dropdown-menu-group-title")).toHaveTextContent(
      "Links",
    );
    // Socials now only links to the project repository (no third-party social links)
    expect(container.querySelectorAll('a[target="_blank"]')).toHaveLength(1);
  });

  it("closes the menu and notifies `onSelect` when an item is selected", async () => {
    const onSelect = vi.fn();
    const { ctx, getAppState } = open();
    const { container } = render(MainMenuHarness, { ctx, onSelect });

    await waitFor(() => expect(byTestId(container, "help-menu-item")).not.toBeNull());
    await fireEvent.click(byTestId(container, "help-menu-item")!);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(getAppState().openMenu).toBe(null);
  });

  it("closes the menu on outside pointer down", async () => {
    const { ctx, getAppState } = open();
    const { container } = render(MainMenuHarness, { ctx });
    await waitFor(() => expect(byTestId(container, "dropdown-menu")).not.toBeNull());

    await fireEvent.pointerDown(document.body);
    expect(getAppState().openMenu).toBe(null);
  });

  it("runs the default items' actions", async () => {
    const { ctx, setAppState, executeAction } = open();
    const { container } = render(MainMenuHarness, { ctx });
    await waitFor(() => expect(byTestId(container, "dropdown-menu")).not.toBeNull());

    await fireEvent.click(byTestId(container, "save-button")!);
    expect(executeAction).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "saveToActiveFile" }),
    );

    await fireEvent.click(byTestId(container, "json-export-button")!);
    expect(setAppState).toHaveBeenCalledWith({
      openDialog: { name: "jsonExport" },
    });

    await fireEvent.click(byTestId(container, "image-export-button")!);
    expect(setAppState).toHaveBeenCalledWith({
      openDialog: { name: "imageExport" },
    });

    await fireEvent.click(byTestId(container, "clear-canvas-button")!);
    expect(editorJotaiStore.peek(activeConfirmDialogAtom)).toBe("clearCanvas");
  });

  it("loads a scene right away on an empty canvas, and asks for confirmation otherwise", async () => {
    // empty canvas
    const empty = open();
    const first = render(MainMenuHarness, { ctx: empty.ctx });
    await waitFor(() => expect(byTestId(first.container, "load-button")).not.toBeNull());
    await fireEvent.click(byTestId(first.container, "load-button")!);
    await waitFor(() =>
      expect(empty.executeAction).toHaveBeenCalledWith(
        expect.objectContaining({ name: "loadScene" }),
      ),
    );
    expect(editorJotaiStore.peek(overwriteConfirmStateAtom).active).toBe(false);
    first.unmount();

    // existing elements
    const withElements = open();
    (withElements.ctx as any).elements = [{ id: "a" }];
    const second = render(MainMenuHarness, { ctx: withElements.ctx });
    await waitFor(() => expect(byTestId(second.container, "load-button")).not.toBeNull());
    await fireEvent.click(byTestId(second.container, "load-button")!);

    const state = editorJotaiStore.peek(overwriteConfirmStateAtom);
    expect(state.active).toBe(true);
    expect(withElements.executeAction).not.toHaveBeenCalled();
    if (state.active) {
      expect(state.color).toBe("warning");
      // confirm => the scene gets loaded
      state.onConfirm();
      await waitFor(() =>
        expect(withElements.executeAction).toHaveBeenCalledWith(
          expect.objectContaining({ name: "loadScene" }),
        ),
      );
    }
  });

  it("toggles the theme without closing the menu", async () => {
    const { ctx, getAppState, executeAction } = open();
    const { container } = render(MainMenuHarness, { ctx });
    await waitFor(() => expect(byTestId(container, "toggle-dark-mode")).not.toBeNull());

    const item = byTestId(container, "toggle-dark-mode")!;
    expect(item).toHaveAttribute("aria-label", "Dark mode");
    await fireEvent.click(item);

    expect(executeAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "toggleTheme" }),
    );
    // `event.preventDefault()` keeps the menu open
    expect(getAppState().openMenu).toBe("canvas");
  });

  it("offers a system theme radio group when allowed and reports through `onThemeChange`", async () => {
    const onThemeChange = vi.fn();
    const { ctx } = open({ props: { onThemeChange } });
    const { container } = render(MainMenuHarness, {
      ctx,
      allowSystemTheme: true,
      systemTheme: "system",
    });
    await waitFor(() => expect(byTestId(container, "dropdown-menu")).not.toBeNull());

    expect(byTestId(container, "toggle-dark-mode")).toBeNull();
    const radios = container.querySelectorAll<HTMLInputElement>(
      'input[name="theme"]',
    );
    expect(radios).toHaveLength(3);
    expect(radios[2].checked).toBe(true);

    await fireEvent.click(radios[1]);
    expect(onThemeChange).toHaveBeenCalledWith("dark");
  });

  it("shows the collaborators list on phones", async () => {
    const { ctx } = createFakeEditor({
      appState: {
        openMenu: "canvas",
        collaborators: new Map([
          ["s1" as any, { socketId: "s1" as any, username: "Ada", id: "ada" }],
        ]),
      },
      editorInterface: { formFactor: "phone" },
    });
    const { container } = render(MainMenuHarness, { ctx });

    await waitFor(() =>
      expect(container.querySelector(".UserList-Wrapper")).not.toBeNull(),
    );
    expect(container.querySelector(".UserList-Wrapper legend")).toHaveTextContent(
      "Collaborators",
    );
    expect(container.querySelector(".UserList_mobile")).not.toBeNull();
  });

  it("opens the preferences submenu from the keyboard", async () => {
    const { ctx } = open();
    const { container } = render(MainMenuHarness, { ctx });
    await waitFor(() => expect(byTestId(container, "dropdown-menu")).not.toBeNull());

    const trigger = container.querySelector<HTMLElement>(
      ".dropdown-menu__submenu-trigger",
    )!;
    expect(trigger).not.toBeNull();
    expect(trigger).toHaveTextContent("Preferences");
    expect(trigger.querySelector(".dropdown-menu__submenu-trigger-icon svg")).not.toBeNull();

    trigger.focus();
    await fireEvent.keyDown(trigger, { key: "ArrowRight" });
    await waitFor(() =>
      expect(
        document.querySelector(".excalidraw-main-menu-preferences-submenu"),
      ).not.toBeNull(),
    );
    expect(
      document.querySelectorAll(
        ".excalidraw-main-menu-preferences-submenu .dropdown-menu-item-base",
      ).length,
    ).toBeGreaterThan(5);
  });
});
