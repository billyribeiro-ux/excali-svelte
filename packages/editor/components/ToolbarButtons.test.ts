import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import DarkModeToggle from "./DarkModeToggle.svelte";
import HelpButton from "./HelpButton.svelte";
import LaserPointerButton from "./LaserPointerButton.svelte";
import LockButton from "./LockButton.svelte";
import PenModeButton from "./PenModeButton.svelte";

describe("LockButton", () => {
  it("renders a toggle that reflects its checked state and reports changes", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(LockButton, {
      title: "Keep selected tool active after drawing",
      checked: false,
      onChange,
    });
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveClass("ToolIcon", "ToolIcon_type_toggle", "ToolIcon__lock");
    expect(button).toHaveAttribute("data-testid", "toolbar-lock");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveAttribute(
      "aria-label",
      "Keep selected tool active after drawing",
    );
    // the keyboard shortcut is part of the title only
    expect(button).toHaveAttribute(
      "title",
      "Keep selected tool active after drawing — Q",
    );
    const unlockedIcon = button.innerHTML;

    await fireEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);

    await rerender({ checked: true, onChange });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("ToolIcon--checked");
    // a different (locked) icon is shown
    expect(button.innerHTML).not.toBe(unlockedIcon);
  });

  it("supports the mobile class and being disabled", async () => {
    const onChange = vi.fn();
    const { container } = render(LockButton, {
      title: "Lock",
      checked: false,
      onChange,
      isMobile: true,
      disabled: true,
    });
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveClass("is-mobile");
    expect(button).toBeDisabled();
    // (native `click()` honours `disabled`, a dispatched event does not)
    button.click();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("PenModeButton", () => {
  it("renders nothing until a pen is detected", async () => {
    const { container, rerender } = render(PenModeButton, {
      title: "Pen mode",
      checked: false,
      penDetected: false,
    });
    expect(container.querySelector("button")).toBeNull();

    const onChange = vi.fn();
    await rerender({
      title: "Pen mode",
      checked: true,
      penDetected: true,
      onChange,
      isMobile: true,
    });
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveClass("ToolIcon__penMode", "is-mobile", "ToolIcon--checked");
    expect(button).toHaveAttribute("aria-label", "Pen mode");
    expect(button).toHaveAttribute("title", "Pen mode");
    await fireEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("LaserPointerButton", () => {
  it("renders a small toggle that reports changes", async () => {
    const onChange = vi.fn();
    const { container } = render(LaserPointerButton, {
      title: "Laser pointer",
      checked: true,
      onChange,
      isMobile: true,
    });
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveClass(
      "ToolIcon__LaserPointer",
      "is-mobile",
      "ToolIcon_size_small",
      "ToolIcon--checked",
    );
    expect(button).toHaveAttribute("data-testid", "toolbar-LaserPointer");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await fireEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("DarkModeToggle", () => {
  it("offers to switch to dark mode from light mode, with the moon icon", async () => {
    const onChange = vi.fn();
    const { container } = render(DarkModeToggle, { value: "light", onChange });
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveAttribute("data-testid", "toggle-dark-mode");
    expect(button).toHaveAttribute("title", "Dark mode");
    expect(button).toHaveAttribute("aria-label", "Dark mode");
    expect(button).toHaveClass("ToolIcon_type_button", "ToolIcon--plain");
    expect(button.querySelector("svg.rtl-mirror path")?.getAttribute("d")).toMatch(
      /^M283\.211 512/,
    );

    await fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("offers to switch to light mode from dark mode, with the sun icon", async () => {
    const onChange = vi.fn();
    const { container } = render(DarkModeToggle, { value: "dark", onChange });
    const button = container.querySelector<HTMLButtonElement>("button")!;
    expect(button).toHaveAttribute("title", "Light mode");
    expect(button.querySelector("svg.rtl-mirror path")?.getAttribute("d")).toMatch(
      /^M256 160c/,
    );

    await fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("uses a custom title when given", () => {
    const { container } = render(DarkModeToggle, {
      value: "light",
      onChange: () => {},
      title: "Custom",
    });
    const button = container.querySelector("button")!;
    expect(button).toHaveAttribute("title", "Custom");
    expect(button).toHaveAttribute("aria-label", "Custom");
  });
});

describe("HelpButton", () => {
  it("renders the help icon button", async () => {
    const onclick = vi.fn();
    const { container } = render(HelpButton, { onclick });
    const button = container.querySelector<HTMLButtonElement>("button.help-icon")!;
    expect(button).toHaveAttribute("aria-label", "Help");
    expect(button).toHaveAttribute("type", "button");
    expect(button.querySelector("svg")).not.toBeNull();

    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);
  });
});
