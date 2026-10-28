import { createRawSnippet } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import Button from "./Button.svelte";

const label = createRawSnippet(() => ({ render: () => "<span>Click me</span>" }));

describe("Button", () => {
  it("renders children inside a button with the base class", () => {
    render(Button, { onSelect: () => {}, children: label });
    const button = screen.getByRole("button");
    expect(button).toHaveClass("excalidraw-button");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveTextContent("Click me");
  });

  it("calls onSelect on click", async () => {
    const onSelect = vi.fn();
    render(Button, { onSelect, children: label });
    await fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls the user onclick first and skips onSelect when it prevents default", async () => {
    const order: string[] = [];
    const onSelect = vi.fn(() => order.push("select"));
    render(Button, {
      onSelect,
      onclick: (event: MouseEvent) => {
        order.push("click");
        event.preventDefault();
      },
      children: label,
    });
    await fireEvent.click(screen.getByRole("button"));
    expect(order).toEqual(["click"]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("applies selected and custom classes and forwards attributes", () => {
    render(Button, {
      onSelect: () => {},
      selected: true,
      class: "custom",
      "aria-label": "go",
      children: label,
    });
    const button = screen.getByRole("button", { name: "go" });
    expect(button).toHaveClass("excalidraw-button", "custom", "selected");
  });
});
