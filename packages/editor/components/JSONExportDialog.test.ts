import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { describe, expect, it, vi } from "vitest";

import { makeDialogCtx } from "./dialogTestUtils";
import Harness from "./DialogContextHarness.test.svelte";
import JSONExportDialog from "./JSONExportDialog.svelte";

// the real action modules pull in bits-ui, which vitest cannot load here
vi.mock("../actions/actionExport", () => ({
  actionSaveFileToDisk: { name: "saveFileToDisk" },
}));
vi.mock("../actions/ActionPanel.svelte", () => ({ default: () => {} }));
vi.mock("../analytics", () => ({ trackEvent: vi.fn() }));

const setup = (
  exportOpts: Record<string, unknown>,
  appState: Record<string, unknown> = { openDialog: { name: "jsonExport" } },
) => {
  const setAppState = vi.fn();
  const executeAction = vi.fn();
  const ctx = makeDialogCtx();
  render(Harness, {
    component: JSONExportDialog,
    componentProps: {
      elements: [],
      appState,
      files: {},
      actionManager: { executeAction },
      exportOpts,
      canvas: document.createElement("canvas"),
      setAppState,
    },
    ctx,
  });
  return { setAppState, executeAction };
};

describe("JSONExportDialog", () => {
  it("renders nothing unless the jsonExport dialog is open", () => {
    setup({ saveFileToDisk: true }, { openDialog: null });
    expect(document.querySelector(".ExportDialog")).toBeNull();
  });

  it("offers save-to-disk and runs the save action", async () => {
    const { executeAction } = setup({ saveFileToDisk: true });
    expect(screen.getByText("Save to disk")).toBeInTheDocument();
    expect(document.querySelector(".ExportDialog--json")).not.toBeNull();
    expect(screen.queryByText("Shareable link")).toBeNull();
    await fireEvent.click(
      screen.getByRole("button", { name: "Save to file" }),
    );
    expect(executeAction).toHaveBeenCalledWith(
      { name: "saveFileToDisk" },
      "ui",
    );
  });

  it("exports to the backend, then closes the dialog", async () => {
    const onExportToBackend = vi.fn().mockResolvedValue(undefined);
    const { setAppState } = setup({ onExportToBackend });
    await fireEvent.click(
      screen.getByRole("button", { name: "Export to Link" }),
    );
    await waitFor(() =>
      expect(setAppState).toHaveBeenCalledWith({ openDialog: null }),
    );
    expect(onExportToBackend).toHaveBeenCalledTimes(1);
  });

  it("surfaces backend export errors as errorMessage", async () => {
    const onExportToBackend = vi.fn().mockRejectedValue(new Error("boom"));
    const { setAppState } = setup({ onExportToBackend });
    await fireEvent.click(
      screen.getByRole("button", { name: "Export to Link" }),
    );
    await waitFor(() =>
      expect(setAppState).toHaveBeenCalledWith({ errorMessage: "boom" }),
    );
  });

  it("renders host supplied custom UI", () => {
    const renderCustomUI = createRawSnippet(() => ({
      render: () => `<div data-testid="custom-ui">custom</div>`,
    }));
    setup({ renderCustomUI });
    expect(screen.getByTestId("custom-ui")).toBeInTheDocument();
  });
});
