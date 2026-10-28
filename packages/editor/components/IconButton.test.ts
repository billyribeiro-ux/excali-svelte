import { createRawSnippet, tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { AbortError } from "../errors";

import IconButton from "./IconButton.svelte";
import { checkIcon } from "./icons";

const child = createRawSnippet(() => ({ render: () => "<i>child</i>" }));

describe("IconButton type=button/icon", () => {
  it("renders the ToolIcon button DOM", () => {
    render(IconButton, {
      type: "button",
      icon: checkIcon,
      "aria-label": "Do",
      title: "Do it",
      "data-testid": "btn",
      keyBindingLabel: "K",
      class: "mine",
      children: child,
    });
    const button = screen.getByTestId("btn");
    expect(button).toHaveClass(
      "ToolIcon_type_button",
      "ToolIcon_size_medium",
      "mine",
      "ToolIcon_type_button--show",
      "ToolIcon",
    );
    expect(button).not.toHaveClass("ToolIcon--plain");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("title", "Do it");
    expect(button).toHaveAttribute("aria-label", "Do");
    const icon = button.querySelector(".ToolIcon__icon")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("aria-disabled", "false");
    expect(icon.querySelector("svg")).not.toBeNull();
    expect(icon.querySelector(".ToolIcon__keybinding")).toHaveTextContent("K");
    expect(button).toHaveTextContent("child");
  });

  it("uses the plain class for type=icon and hides when not visible", () => {
    render(IconButton, {
      type: "icon",
      icon: checkIcon,
      visible: false,
      "aria-label": "x",
    });
    const button = screen.getByRole("button", { hidden: true });
    expect(button).toHaveClass("ToolIcon--plain", "ToolIcon_type_button--hide");
  });

  it("shows the label text and the aria-label when requested", () => {
    render(IconButton, {
      type: "button",
      label: "Lbl",
      showAriaLabel: true,
      size: "small",
      "aria-label": "Aria",
    });
    const button = screen.getByRole("button");
    expect(button).toHaveClass("ToolIcon_size_small");
    expect(button.querySelector(".ToolIcon__icon")).toHaveTextContent("Lbl");
    expect(button.querySelector(".ToolIcon__label")).toHaveTextContent("Aria");
  });

  it("is disabled and shows a spinner while loading", () => {
    const { container } = render(IconButton, {
      type: "button",
      icon: checkIcon,
      isLoading: true,
      "aria-label": "x",
    });
    expect(screen.getByRole("button")).toBeDisabled();
    expect(container.querySelector(".Spinner")).not.toBeNull();
  });

  it("calls onclick and loads while a returned promise is pending", async () => {
    let resolve!: () => void;
    const onclick = vi.fn(
      () => new Promise<void>((r) => (resolve = r)),
    );
    render(IconButton, { type: "button", icon: checkIcon, "aria-label": "x", onclick });
    const button = screen.getByRole("button");
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    resolve();
    await vi.waitFor(() => expect(button).not.toBeDisabled());
  });

  it("warns (and recovers) on AbortError", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onclick = vi.fn(() => Promise.reject(new AbortError()));
    render(IconButton, { type: "button", icon: checkIcon, "aria-label": "x", onclick });
    const button = screen.getByRole("button");
    await fireEvent.click(button);
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    await vi.waitFor(() => expect(button).not.toBeDisabled());
    warn.mockRestore();
  });
});

describe("IconButton type=toggle", () => {
  it("renders pressed state and aria attributes", () => {
    render(IconButton, {
      type: "toggle",
      icon: checkIcon,
      checked: true,
      "aria-label": "Tool",
      "aria-keyshortcuts": "V",
      "data-testid": "tool",
      title: "T",
      keyBindingLabel: "1",
    });
    const button = screen.getByTestId("tool");
    expect(button).toHaveClass(
      "ToolIcon",
      "ToolIcon_type_toggle",
      "ToolIcon_size_medium",
      "ToolIcon--checked",
    );
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("aria-keyshortcuts", "V");
    expect(button).toHaveAttribute("aria-disabled", "false");
    expect(button.querySelector(".ToolIcon__keybinding")).toHaveTextContent("1");
  });

  it("reports the pointer type captured on pointerdown at click", async () => {
    const onSelect = vi.fn();
    const onpointerdown = vi.fn();
    render(IconButton, {
      type: "toggle",
      icon: checkIcon,
      checked: false,
      "aria-label": "Tool",
      onSelect,
      onpointerdown,
    });
    const button = screen.getByRole("button");

    // keyboard / AT activation: no pointer down before the click
    await fireEvent.click(button);
    expect(onSelect).toHaveBeenLastCalledWith({ pointerType: null });

    const down = new Event("pointerdown", { bubbles: true });
    Object.defineProperty(down, "pointerType", { value: "touch" });
    button.dispatchEvent(down);
    await tick();
    expect(onpointerdown).toHaveBeenCalledTimes(1);
    await fireEvent.click(button);
    expect(onSelect).toHaveBeenLastCalledWith({ pointerType: "touch" });
  });

  it("is disabled when disabled", () => {
    render(IconButton, {
      type: "toggle",
      checked: false,
      disabled: true,
      "aria-label": "Tool",
    });
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});
