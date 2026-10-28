import { fireEvent, render } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";

import ViewportStatusBadge from "./ViewportStatusBadge.svelte";
import ViewportStatusBorder from "./ViewportStatusBorder.svelte";

describe("ViewportStatusBorder", () => {
  it("renders a border of the given color and merges a custom style", () => {
    const { container } = render(ViewportStatusBorder, {
      border: "red",
      style: "right: 10px;",
    });
    const border = container.querySelector<HTMLElement>(
      ".viewport-status-frame__border",
    )!;
    expect(border.style.borderColor).toBe("red");
    expect(border.style.right).toBe("10px");
  });
});

describe("ViewportStatusBadge", () => {
  it("renders a plain status badge using the border as its background", () => {
    const { container } = render(ViewportStatusBadge, {
      label: { label: "Following Ada" },
      border: "rgb(1, 2, 3)",
    });
    const badge = container.querySelector<HTMLElement>(
      ".viewport-status-frame__badge",
    )!;
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).not.toHaveClass("viewport-status-frame__badge--clickable");
    expect(
      badge.style.getPropertyValue("--viewport-status-frame-badge-background"),
    ).toBe("rgb(1, 2, 3)");
    expect(
      badge.querySelector(".viewport-status-frame__badge-label"),
    ).toHaveTextContent("Following Ada");
    expect(badge.querySelector("button")).toBeNull();
    expect(badge.querySelector(".viewport-status-frame__badge-icon")).toBeNull();
  });

  it("uses an explicit background and color, falling back to the primary color", () => {
    const explicit = render(ViewportStatusBadge, {
      label: { label: "x", background: "blue", color: "white" },
      border: "red",
    });
    const badge = explicit.container.querySelector<HTMLElement>(
      ".viewport-status-frame__badge",
    )!;
    expect(
      badge.style.getPropertyValue("--viewport-status-frame-badge-background"),
    ).toBe("blue");
    expect(badge.style.color).toBe("white");
    explicit.unmount();

    const fallback = render(ViewportStatusBadge, { label: { label: "x" } });
    expect(
      fallback.container
        .querySelector<HTMLElement>(".viewport-status-frame__badge")!
        .style.getPropertyValue("--viewport-status-frame-badge-background"),
    ).toBe("var(--color-primary)");
  });

  it("renders the label and icon from snippets and components", () => {
    const { container } = render(ViewportStatusBadge, {
      label: {
        label: createRawSnippet(() => ({ render: () => "<em>snippet</em>" })),
        icon: createRawSnippet(() => ({ render: () => "<i>icon</i>" })),
      },
    });
    expect(
      container.querySelector(".viewport-status-frame__badge-icon i"),
    ).toHaveTextContent("icon");
    expect(
      container.querySelector(".viewport-status-frame__badge-label em"),
    ).toHaveTextContent("snippet");
  });

  it("makes the label interactive and adds a close button when handlers are given", async () => {
    const onClick = vi.fn();
    const onClose = vi.fn();
    const { container } = render(ViewportStatusBadge, {
      label: { label: "Stop", onClick, onClose },
    });
    const badge = container.querySelector(".viewport-status-frame__badge")!;
    expect(badge).toHaveClass("viewport-status-frame__badge--clickable");

    const action = badge.querySelector<HTMLElement>(
      ".viewport-status-frame__badge-action",
    )!;
    const label = badge.querySelector<HTMLElement>(
      ".viewport-status-frame__badge-label",
    )!;
    // the invisible action button is labelled by the label
    expect(label.id).toBeTruthy();
    expect(action).toHaveAttribute("aria-labelledby", label.id);
    await fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);

    const close = badge.querySelector<HTMLElement>(
      ".viewport-status-frame__badge-close",
    )!;
    expect(close).toHaveAttribute("aria-label", "Close");
    await fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
