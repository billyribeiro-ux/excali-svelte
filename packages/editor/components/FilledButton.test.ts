import { createRawSnippet } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import FilledButton from "./FilledButton.svelte";
import { checkIcon } from "./icons";

const child = createRawSnippet(() => ({ render: () => "<i>child</i>" }));

describe("FilledButton", () => {
  it("renders default variant/color/size classes and the label", () => {
    render(FilledButton, { label: "Save", class: "x", fullWidth: true });
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass(
      "ExcButton",
      "ExcButton--color-primary",
      "ExcButton--variant-filled",
      "ExcButton--size-medium",
      "ExcButton--status-undefined",
      "ExcButton--fullWidth",
      "x",
    );
    expect(button).toHaveAttribute("type", "button");
    expect(button.querySelector(".ExcButton__contents")).toHaveTextContent("Save");
  });

  it("prefers children over the label and hides content for the icon variant", () => {
    const { rerender } = render(FilledButton, {
      label: "Save",
      children: child,
      icon: checkIcon,
    });
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("child");
    expect(button).not.toHaveTextContent("Save");
    const iconWrap = button.querySelector(".ExcButton__icon")!;
    expect(iconWrap).toHaveAttribute("aria-hidden", "true");
    expect(iconWrap.querySelector("svg")).not.toBeNull();
    rerender({ variant: "icon" });
    expect(button).not.toHaveTextContent("child");
    expect(button).toHaveClass("ExcButton--variant-icon");
  });

  it("shows the success state: success color, check icon and disabled", () => {
    const { container } = render(FilledButton, {
      label: "Done",
      status: "success",
      color: "danger",
    });
    const button = screen.getByRole("button");
    expect(button).toHaveClass("ExcButton--color-success", "ExcButton--status-success");
    expect(button).toBeDisabled();
    expect(container.querySelector(".ExcButton__statusIcon svg")).not.toBeNull();
  });

  it("shows a spinner after 50ms while the click promise is pending", async () => {
    vi.useFakeTimers();
    try {
      let resolve!: () => void;
      const onclick = vi.fn(() => new Promise<void>((r) => (resolve = r)));
      const { container } = render(FilledButton, { label: "Go", onclick });
      const button = screen.getByRole("button");
      await fireEvent.click(button);
      expect(container.querySelector(".Spinner")).toBeNull();
      await vi.advanceTimersByTimeAsync(50);
      expect(button).toHaveClass("ExcButton--status-loading");
      expect(button).toBeDisabled();
      expect(container.querySelector(".ExcButton__statusIcon.Spinner")).not.toBeNull();
      resolve();
      await vi.advanceTimersByTimeAsync(0);
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass("ExcButton--status-loading");
    } finally {
      vi.useRealTimers();
    }
  });

  it("respects disabled", () => {
    render(FilledButton, { label: "Go", disabled: true });
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
