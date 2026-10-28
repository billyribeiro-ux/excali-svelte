import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import TextField from "./TextField.svelte";
import { searchIcon } from "./icons";

describe("TextField", () => {
  it("renders label, icon and input classes", () => {
    const { container } = render(TextField, {
      value: "abc",
      label: "Name",
      icon: searchIcon,
      fullWidth: true,
      readonly: true,
      class: "mine",
      placeholder: "ph",
      type: "search",
    });
    const root = container.querySelector(".ExcTextField") as HTMLElement;
    expect(root).toHaveClass("mine", "ExcTextField--fullWidth", "ExcTextField--hasIcon");
    expect(root.querySelector("svg")).not.toBeNull();
    expect(root.querySelector(".ExcTextField__label")).toHaveTextContent("Name");
    expect(root.querySelector(".ExcTextField__input")).toHaveClass(
      "ExcTextField__input--readonly",
    );
    const input = screen.getByPlaceholderText("ph") as HTMLInputElement;
    expect(input.value).toBe("abc");
    expect(input.readOnly).toBe(true);
    expect(input).toHaveAttribute("type", "search");
  });

  it("supports an uncontrolled defaultValue", () => {
    render(TextField, { defaultValue: "start", placeholder: "ph" });
    expect((screen.getByPlaceholderText("ph") as HTMLInputElement).value).toBe("start");
  });

  it("reports changes and snaps back when controlled", async () => {
    const onChange = vi.fn();
    render(TextField, { value: "abc", placeholder: "ph", onChange });
    const input = screen.getByPlaceholderText("ph") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "abcd" } });
    expect(onChange).toHaveBeenCalledWith("abcd");
    expect(input.value).toBe("abc");
  });

  it("forwards keydown and focuses the input when the field is clicked", async () => {
    const onkeydown = vi.fn();
    const { container } = render(TextField, { value: "", placeholder: "ph", onkeydown });
    const input = screen.getByPlaceholderText("ph");
    await fireEvent.keyDown(input, { key: "a" });
    expect(onkeydown).toHaveBeenCalledTimes(1);
    await fireEvent.click(container.querySelector(".ExcTextField")!);
    expect(document.activeElement).toBe(input);
  });

  it("selects the text on render when requested", () => {
    render(TextField, { value: "hello", placeholder: "ph", selectOnRender: true });
    const input = screen.getByPlaceholderText("ph") as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(5);
  });

  it("redacts the value until temporarily revealed", async () => {
    render(TextField, { value: "secret", placeholder: "ph", isRedacted: true });
    const input = screen.getByPlaceholderText("ph");
    expect(input).toHaveClass("is-redacted");
    await fireEvent.click(screen.getByRole("button"));
    expect(input).not.toHaveClass("is-redacted");
    await fireEvent.click(screen.getByRole("button"));
    expect(input).toHaveClass("is-redacted");
  });
});
