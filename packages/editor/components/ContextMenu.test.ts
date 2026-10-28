import { tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import { CONTEXT_MENU_SEPARATOR } from "./ContextMenu";
import ContextMenu from "./ContextMenu.svelte";

import type { ContextMenuItems } from "./ContextMenu";

const action = (name: string, extra: Record<string, unknown> = {}) =>
  ({
    name,
    label: `labels.${name}`,
    perform: vi.fn(),
    trackEvent: false,
    ...extra,
  } as any);

const renderMenu = async (items: ContextMenuItems, extra: Record<string, unknown> = {}) => {
  const ctx = createFakeEditorContext({
    appState: { width: 800, height: 600, theme: "light" },
  });
  const onClose = vi.fn();
  render(EditorContextHarness, {
    props: {
      component: ContextMenu,
      ctx,
      props: {
        actionManager: ctx.actionManager,
        items,
        top: 10,
        left: 20,
        onClose,
        ...extra,
      },
    },
  });
  await tick();
  return { ctx, onClose };
};

describe("ContextMenu", () => {
  it("renders a popover with labelled items and shortcuts", async () => {
    await renderMenu([action("copy"), action("cut")]);
    const popover = document.querySelector(".popover.context-menu-popover");
    expect(popover).not.toBeNull();
    const items = document.querySelectorAll("ul.context-menu > li");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("data-testid", "copy");
    expect(items[0].querySelector(".context-menu-item__label")).toHaveTextContent("Copy");
    expect(items[0].querySelector("button.context-menu-item")).toHaveAttribute("type", "button");
    expect(items[0].querySelector("kbd.context-menu-item__shortcut")).toHaveTextContent(/C/i);
    expect(items[1].querySelector(".context-menu-item__label")).toHaveTextContent("Cut");
  });

  it("filters out falsy items and items failing their predicate", async () => {
    await renderMenu([
      false,
      null,
      undefined,
      action("copy", { predicate: () => false }),
      action("cut", { predicate: () => true }),
    ]);
    const items = document.querySelectorAll("ul.context-menu > li");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveAttribute("data-testid", "cut");
  });

  it("passes elements, appState, props and app to predicates", async () => {
    const predicate = vi.fn(() => true);
    const { ctx } = await renderMenu([action("copy", { predicate })]);
    expect(predicate).toHaveBeenCalledWith(
      ctx.elements,
      ctx.appState,
      ctx.actionManager.app.props,
      ctx.actionManager.app,
    );
  });

  it("renders separators only between items", async () => {
    await renderMenu([
      CONTEXT_MENU_SEPARATOR,
      action("copy"),
      CONTEXT_MENU_SEPARATOR,
      CONTEXT_MENU_SEPARATOR,
      action("cut"),
    ]);
    const children = Array.from(document.querySelector("ul.context-menu")!.children);
    expect(children.map((el) => el.tagName)).toEqual(["LI", "HR", "LI"]);
    expect(children[1]).toHaveClass("context-menu-item-separator");
  });

  it("supports function labels", async () => {
    await renderMenu([action("copy", { label: () => "labels.cut" })]);
    expect(document.querySelector(".context-menu-item__label")).toHaveTextContent("Cut");
  });

  it("marks dangerous and checked items", async () => {
    await renderMenu([
      action("deleteSelectedElements", { label: "labels.delete" }),
      action("copy", { checked: () => true }),
    ]);
    const buttons = document.querySelectorAll("button.context-menu-item");
    expect(buttons[0]).toHaveClass("dangerous");
    expect(buttons[0]).not.toHaveClass("checkmark");
    expect(buttons[1]).toHaveClass("checkmark");
  });

  it("closes first, then executes the action from the contextMenu source", async () => {
    const item = action("copy");
    const { ctx, onClose } = await renderMenu([item]);
    await fireEvent.click(screen.getByTestId("copy"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(ctx.actionManager.executeAction).not.toHaveBeenCalled();
    onClose.mock.calls[0][0]();
    expect(ctx.actionManager.executeAction).toHaveBeenCalledWith(item, "contextMenu");
  });

  it("prevents the native context menu on the list", async () => {
    await renderMenu([action("copy")]);
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    document.querySelector("ul.context-menu")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("closes on a pointerdown outside", async () => {
    const { onClose } = await renderMenu([action("copy")]);
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
