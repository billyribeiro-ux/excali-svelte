import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { makeDialogCtx } from "../dialogTestUtils";
import Harness from "../DialogContextHarness.test.svelte";

import TTDDialogOutput from "./TTDDialogOutput.svelte";

const setup = (props: Record<string, unknown>, app: Record<string, unknown> = {}) =>
  render(Harness, {
    component: TTDDialogOutput,
    componentProps: { error: null, loadStatus: "loaded", ...props },
    ctx: makeDialogCtx({ app }),
  });

describe("<TTDDialogOutput />", () => {
  it("renders the canvas container once the lib is loaded", () => {
    setup({});
    expect(
      document.querySelector(
        ".ttd-dialog-output-canvas-container .ttd-dialog-output-canvas-content",
      ),
    ).not.toBeNull();
    expect(document.querySelector(".ttd-dialog-output-wrapper")).not.toHaveClass(
      "ttd-dialog-output-wrapper--error",
    );
  });

  it("shows a spinner while the lib is loading", () => {
    setup({ loadStatus: "loading" });
    expect(document.querySelector(".Spinner")).not.toBeNull();
    expect(document.querySelector(".ttd-dialog-output-canvas-container")).toBeNull();
  });

  it("shows a parse error and hides the canvas", () => {
    setup({
      error: new Error("Parse error on line 2:\n...flow\n----^\nExpecting 'X'"),
    });
    expect(document.querySelector(".ttd-dialog-output-wrapper")).toHaveClass(
      "ttd-dialog-output-wrapper--error",
    );
    const error = document.querySelector(
      '[data-testid="ttd-dialog-output-error"]',
    )!;
    expect(error).not.toBeNull();
    expect(error.querySelector(".ttd-dialog-output-error-message")).toHaveTextContent(
      "Parse error on line 2",
    );
    expect(
      document.querySelector(".ttd-dialog-output-canvas-container"),
    ).toHaveClass("invisible");
  });

  it("renders the caret line of a parse error with its own class", () => {
    setup({ error: new Error("Parse error on line 2:\n...flow\n----^\nExpecting") });
    expect(
      document.querySelector(".ttd-dialog-output-error-message__caret"),
    ).toHaveTextContent("----^");
  });

  it("hides error details when asked to", () => {
    setup({
      error: new Error("Parse error on line 2:\n...flow\n----^"),
      hideErrorDetails: true,
      autoFixAvailable: true,
      onApplyAutoFix: () => {},
    });
    expect(
      document.querySelector(".ttd-dialog-output-error-message"),
    ).toHaveTextContent("Mermaid syntax error");
    expect(document.querySelector(".ttd-dialog-output-error-summary")).toBeNull();
    expect(document.querySelector(".ttd-dialog-output-error-autofix-slot")).toBeNull();
  });

  it("offers the auto fix when available", async () => {
    const onApplyAutoFix = vi.fn();
    setup({
      error: new Error("Parse error on line 2:\n...flow\n----^\nExpecting"),
      autoFixAvailable: true,
      onApplyAutoFix,
    });
    await fireEvent.click(
      screen.getByRole("button", { name: "Auto-fix is available" }),
    );
    expect(onApplyAutoFix).toHaveBeenCalledTimes(1);
  });

  it("does not treat a diagram chunk load failure as a syntax error", () => {
    setup({
      error: new TypeError(
        "Failed to fetch dynamically imported module: http://localhost/assets/x.js",
      ),
    });
    expect(
      document.querySelector('[data-testid="ttd-dialog-output-error"]'),
    ).toBeNull();
    expect(
      document.querySelector(".ttd-dialog-output-canvas-container"),
    ).not.toHaveClass("invisible");
  });

  it("shows a retryable load error", async () => {
    const onRetryLoad = vi.fn();
    setup({ loadStatus: "error", onRetryLoad });
    expect(
      document.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
    ).toHaveTextContent("Couldn't load Mermaid. Check your internet connection");
    expect(document.querySelector(".ttd-dialog-output-canvas-container")).toBeNull();
    await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });

  it("asks for a reload when only a reload can recover", async () => {
    const reload = vi.fn();
    setup(
      { loadStatus: "error", loadErrorReloadRequired: true, onRetryLoad: vi.fn() },
      { ownerWindow: { location: { reload } } },
    );
    expect(
      document.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
    ).toHaveTextContent("Reload the page");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    await fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
