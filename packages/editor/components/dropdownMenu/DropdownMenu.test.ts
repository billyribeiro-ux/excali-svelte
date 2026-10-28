import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { CLASSES, KEYS } from "@svelte-draw/common";

import FallbackHarness from "../hoc/FallbackHarness.test.svelte";
import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import DropdownMenuHarness from "./DropdownMenuHarness.test.svelte";

const queryMenu = (container: HTMLElement) =>
  container.querySelector('[data-testid="dropdown-menu"]');

describe("Test <DropdownMenu/>", () => {
  it("closes on Escape", async () => {
    const { ctx, getAppState } = createFakeEditor();
    const { container } = render(FallbackHarness, { ctx, host: false });

    expect(getAppState().openMenu).toBe(null);

    await fireEvent.click(
      container.querySelector<HTMLElement>('[data-testid="main-menu-trigger"]')!,
    );
    expect(getAppState().openMenu).toBe("canvas");

    await waitFor(() => {
      fireEvent.keyDown(document, { key: KEYS.ESCAPE });
      expect(getAppState().openMenu).toBe(null);
    });
  });

  it("closes a host-controlled menu on Escape", async () => {
    const { ctx } = createFakeEditor();
    const { container } = render(DropdownMenuHarness, { ctx });

    await fireEvent.click(
      container.querySelector<HTMLElement>(".App-toolbar__extra-tools-trigger")!,
    );
    await waitFor(() => expect(queryMenu(container)).not.toBeNull());

    fireEvent.keyDown(document, { key: KEYS.ESCAPE });
    await waitFor(() => expect(queryMenu(container)).toBeNull());
  });

  describe.each([
    ["main menu", FallbackHarness, { host: false }, '[data-testid="main-menu-trigger"]'],
    ["more tools", DropdownMenuHarness, {}, ".App-toolbar__extra-tools-trigger"],
  ] as const)("%s", (_, Harness, extraProps, triggerSelector) => {
    it("closes on outside pointer and touch events after reopening", async () => {
      const { ctx } = createFakeEditor();
      const { container } = render(Harness as any, { ctx, ...extraProps });
      const trigger = container.querySelector<HTMLElement>(triggerSelector)!;
      const canvas =
        container.querySelector<HTMLCanvasElement>("canvas") ??
        container.appendChild(document.createElement("canvas"));
      const toolbar =
        container.querySelector<HTMLElement>('[data-testid="toolbar-rectangle"]') ??
        container.appendChild(
          Object.assign(document.createElement("button"), {
            type: "button",
          }),
        );

      for (const outsideTarget of [canvas, toolbar]) {
        for (const event of [fireEvent.pointerDown, fireEvent.touchStart]) {
          await fireEvent.click(trigger);
          await waitFor(() => {
            expect(queryMenu(container)).not.toBeNull();
          });

          await event(outsideTarget);
          await waitFor(() => {
            expect(queryMenu(container)).toBeNull();
          });
        }
      }
    });
  });

  describe("items", () => {
    const openMenu = async (props: Record<string, unknown> = {}) => {
      const { ctx } = createFakeEditor();
      const result = render(DropdownMenuHarness, { ctx, ...props });
      await fireEvent.click(
        result.container.querySelector<HTMLElement>(
          ".App-toolbar__extra-tools-trigger",
        )!,
      );
      await waitFor(() => expect(queryMenu(result.container)).not.toBeNull());
      return result;
    };

    it("renders the trigger with its class, title and test id", async () => {
      const { ctx } = createFakeEditor();
      const { container } = render(DropdownMenuHarness, { ctx });
      const trigger = container.querySelector<HTMLElement>(
        '[data-testid="dropdown-menu-button"]',
      )!;
      expect(trigger).toHaveClass(
        "dropdown-menu-button",
        "App-toolbar__extra-tools-trigger",
        "zen-mode-transition",
      );
      expect(trigger).not.toHaveClass("dropdown-menu-button--mobile");
      expect(trigger).toHaveAttribute("title", "More tools");
      expect(trigger).toHaveAttribute("type", "button");
      // controlled: closed until the host opens it
      expect(queryMenu(container)).toBeNull();
    });

    it("renders the menu with the expected structure and classes", async () => {
      const { container } = await openMenu();
      const menu = queryMenu(container)!;
      expect(menu).toHaveClass("dropdown-menu", "test-menu");
      expect(menu.querySelector(".dropdown-menu-container.Island")).not.toBeNull();
      // trigger and content share the event wrapper (removed from layout)
      const wrapper = container.querySelector<HTMLElement>(
        `.${CLASSES.DROPDOWN_MENU_EVENT_WRAPPER}`,
      )!;
      expect(wrapper).toHaveStyle({ display: "contents" });
      expect(wrapper.contains(menu)).toBe(true);
      expect(
        wrapper.querySelector('[data-testid="dropdown-menu-button"]'),
      ).not.toBeNull();

      const item = menu.querySelector<HTMLElement>('[data-testid="plain-item"]')!;
      expect(item.tagName).toBe("BUTTON");
      expect(item).toHaveClass(
        "dropdown-menu-item",
        "dropdown-menu-item-base",
        "radix-menu-item",
      );
      expect(item.querySelector(".dropdown-menu-item__icon svg")).not.toBeNull();
      expect(item.querySelector(".dropdown-menu-item__text")).toHaveTextContent(
        "Plain",
      );
      expect(item.querySelector(".dropdown-menu-item__shortcut")).toHaveTextContent(
        "Q",
      );

      const keepOpen = menu.querySelector<HTMLElement>(
        '[data-testid="keep-open-item"]',
      )!;
      expect(keepOpen).toHaveClass("dropdown-menu-item--selected");
      // title falls back to aria-label
      expect(keepOpen).toHaveAttribute("title", "Keep open");

      expect(menu.querySelector(".dropdown-menu-group-title")).toHaveTextContent(
        "Group title",
      );
      expect(
        menu.querySelector('[data-testid="custom-item"]'),
      ).toHaveClass("dropdown-menu-item-base", "dropdown-menu-item-custom");
    });

    it("calls the item's onSelect and the content's onSelect, which closes the menu", async () => {
      const onItemSelect = vi.fn();
      const onContentSelect = vi.fn();
      const { container } = await openMenu({ onItemSelect, onContentSelect });

      await fireEvent.click(
        container.querySelector('[data-testid="plain-item"]')!,
      );

      expect(onItemSelect).toHaveBeenCalledTimes(1);
      expect(onContentSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(queryMenu(container)).toBeNull());
    });

    it("does not notify the content (menu stays open) when the item prevents default", async () => {
      const onKeepOpenSelect = vi.fn();
      const onContentSelect = vi.fn();
      const { container } = await openMenu({ onKeepOpenSelect, onContentSelect });

      await fireEvent.click(
        container.querySelector('[data-testid="keep-open-item"]')!,
      );

      expect(onKeepOpenSelect).toHaveBeenCalledTimes(1);
      expect(onContentSelect).not.toHaveBeenCalled();
      expect(queryMenu(container)).not.toBeNull();
    });

    it("shows a check icon for checked items and an empty one for unchecked", async () => {
      const { container } = await openMenu();
      const checked = container.querySelector(
        '[data-testid="checked-item"] .dropdown-menu-item__icon',
      )!;
      const unchecked = container.querySelector(
        '[data-testid="unchecked-item"] .dropdown-menu-item__icon',
      )!;
      expect(checked.querySelector("polyline")).not.toBeNull();
      expect(unchecked.querySelector("polyline")).toBeNull();
    });

    it("renders link items as new-tab anchors", async () => {
      const { container } = await openMenu();
      const link = container.querySelector<HTMLAnchorElement>(
        '[data-testid="link-item"]',
      )!;
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener external");
    });

    it("applies the mobile classes on phones", async () => {
      const { ctx } = createFakeEditor({
        editorInterface: { formFactor: "phone" },
      });
      const { container } = render(DropdownMenuHarness, { ctx });
      const trigger = container.querySelector<HTMLElement>(
        ".App-toolbar__extra-tools-trigger",
      )!;
      expect(trigger).toHaveClass("dropdown-menu-button--mobile");

      await fireEvent.click(trigger);
      await waitFor(() => expect(queryMenu(container)).not.toBeNull());
      const menu = queryMenu(container)!;
      expect(menu).toHaveClass("dropdown-menu--mobile");
      // phones render a plain column instead of an island
      expect(menu.querySelector(".Stack.Stack_vertical.dropdown-menu-container")).not.toBeNull();
      expect(menu.querySelector(".Island")).toBeNull();
      // and hide shortcuts
      expect(menu.querySelector(".dropdown-menu-item__shortcut")).toBeNull();
    });
  });
});
