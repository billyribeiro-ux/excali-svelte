import { fireEvent, render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";

import TTDDialogPanel from "./TTDDialogPanel.svelte";

import type { TTDPanelAction } from "./TTDDialogPanel.svelte";

const text = (value: string) =>
  createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

const icon = { html: '<svg data-testid="icon"></svg>' };

describe("<TTDDialogPanel />", () => {
  it("renders children and an invisible empty action container", () => {
    render(TTDDialogPanel, { children: text("body"), class: "extra" });
    const panel = document.querySelector(".ttd-dialog-panel")!;
    expect(panel).toHaveClass("extra");
    expect(panel).toHaveTextContent("body");
    expect(panel.querySelector(".ttd-dialog-panel__header")).toBeNull();
    expect(
      panel.querySelector(".ttd-dialog-panel-button-container"),
    ).toHaveClass("invisible");
  });

  it("renders a string label inside a <label> in the header", () => {
    render(TTDDialogPanel, { children: text("body"), label: "Prompt" });
    expect(
      document.querySelector(".ttd-dialog-panel__header label"),
    ).toHaveTextContent("Prompt");
  });

  it("renders a snippet label and top right content", () => {
    render(TTDDialogPanel, {
      children: text("body"),
      label: text("custom label"),
      renderTopRight: text("top right"),
    });
    expect(document.querySelector(".ttd-dialog-panel__header")).toHaveTextContent(
      /custom label\s*top right/,
    );
  });

  it("renders button, link and rate limit actions", async () => {
    const button = vi.fn();
    const link = vi.fn();
    const panelActions: TTDPanelAction[] = [
      { label: "Go", action: button, variant: "button", icon },
      { label: "More", action: link, variant: "link", icon },
      { label: "5 left", variant: "rateLimit", className: "danger" },
    ];
    render(TTDDialogPanel, {
      children: text("body"),
      panelActions,
      panelActionJustifyContent: "space-between",
    });

    const container = document.querySelector(
      ".ttd-dialog-panel-button-container",
    ) as HTMLElement;
    expect(container).not.toHaveClass("invisible");
    expect(container.style.justifyContent).toBe("space-between");

    const goButton = screen.getByRole("button", { name: /Go/ });
    expect(goButton).toHaveClass("excalidraw-button", "ttd-dialog-panel-button");
    expect(goButton.querySelector("svg")).not.toBeNull();
    await fireEvent.click(goButton);
    expect(button).toHaveBeenCalledTimes(1);

    const linkButton = screen.getByRole("button", { name: /More/ });
    expect(linkButton).toHaveClass("ttd-dialog-panel-action-link");
    expect(
      linkButton.querySelector(".ttd-dialog-panel-action-link__icon svg"),
    ).not.toBeNull();
    await fireEvent.click(linkButton);
    expect(link).toHaveBeenCalledTimes(1);

    expect(document.querySelector(".ttd-dialog-panel__rate-limit")).toHaveClass(
      "danger",
    );
  });

  it("shows a spinner and disables actions while a submit is in progress", () => {
    render(TTDDialogPanel, {
      children: text("body"),
      onTextSubmitInProgess: true,
      panelActions: [{ label: "Go", action: () => {}, variant: "button" }],
      renderSubmitShortcut: text("shortcut"),
    });
    const goButton = screen.getByRole("button");
    expect(goButton).toBeDisabled();
    expect(goButton.querySelector(".Spinner")).not.toBeNull();
    expect(goButton.querySelector("div")).toHaveClass("invisible");
    // the submit shortcut is hidden while submitting
    expect(document.querySelector(".ttd-dialog-panel")).not.toHaveTextContent(
      "shortcut",
    );
  });

  it("renders the submit shortcut otherwise", () => {
    render(TTDDialogPanel, {
      children: text("body"),
      renderSubmitShortcut: text("shortcut"),
    });
    expect(document.querySelector(".ttd-dialog-panel")).toHaveTextContent(
      "shortcut",
    );
  });
});
