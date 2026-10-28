import { createRawSnippet } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Toast from "./Toast.svelte";
import ToastProgressBar from "./ToastProgressBar.svelte";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a status with the message", () => {
    render(Toast, { message: "Saved", onClose: () => {}, style: "top: 3px" });
    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("Toast");
    expect(toast.querySelector(".Toast__message")).toHaveTextContent("Saved");
    expect(toast.style.top).toBe("3px");
  });

  it("renders snippet and component messages", () => {
    const message = createRawSnippet(() => ({ render: () => "<b>bold</b>" }));
    render(Toast, { message, onClose: () => {} });
    expect(screen.getByRole("status").querySelector("b")).toHaveTextContent("bold");
  });

  it("auto closes after the default 5s", async () => {
    const onClose = vi.fn();
    render(Toast, { message: "x", onClose });
    await vi.advanceTimersByTimeAsync(4999);
    expect(onClose).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("never auto closes with an infinite duration", async () => {
    const onClose = vi.fn();
    render(Toast, { message: "x", onClose, duration: Infinity });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("pauses while hovered and restarts on leave", async () => {
    const onClose = vi.fn();
    render(Toast, { message: "x", onClose, duration: 1000 });
    const toast = screen.getByRole("status");
    await vi.advanceTimersByTimeAsync(500);
    await fireEvent.mouseEnter(toast);
    await vi.advanceTimersByTimeAsync(5000);
    expect(onClose).not.toHaveBeenCalled();
    await fireEvent.mouseLeave(toast);
    await vi.advanceTimersByTimeAsync(1000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a close button when closable", async () => {
    const onClose = vi.fn();
    render(Toast, { message: "x", onClose, closable: true, duration: Infinity });
    const button = screen.getByRole("button", { name: "close" });
    expect(button).toHaveClass("close");
    await fireEvent.click(button);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not show a close button by default", () => {
    render(Toast, { message: "x", onClose: () => {} });
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("ToastProgressBar", () => {
  it("clamps the fill width to 5%", () => {
    const { container } = render(ToastProgressBar, { progress: 0.5 });
    expect(container.querySelector(".Toast__progress-bar")).not.toBeNull();
    expect(
      (container.querySelector(".Toast__progress-bar-fill") as HTMLElement).style.width,
    ).toBe("5%");
  });

  it("uses the rounded percentage below the clamp", () => {
    const { container } = render(ToastProgressBar, { progress: 0.02 });
    expect(
      (container.querySelector(".Toast__progress-bar-fill") as HTMLElement).style.width,
    ).toBe("2%");
  });
});
