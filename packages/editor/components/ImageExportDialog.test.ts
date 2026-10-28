import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { EXPORT_IMAGE_TYPES } from "@svelte-draw/common";

import { makeDialogCtx } from "./dialogTestUtils";
import Harness from "./DialogContextHarness.test.svelte";
import ImageExportDialog from "./ImageExportDialog.svelte";

// the real action modules pull in bits-ui, which vitest cannot load here
vi.mock("../actions/actionExport", () => ({
  actionExportWithDarkMode: { name: "exportWithDarkMode" },
  actionChangeExportBackground: { name: "changeExportBackground" },
  actionChangeExportEmbedScene: { name: "changeExportEmbedScene" },
  actionChangeExportScale: { name: "changeExportScale" },
  actionChangeProjectName: { name: "changeProjectName" },
}));
vi.mock("../scene/export", () => ({
  exportScene: vi.fn(),
  getExportConfigFromAppState: vi.fn(() => ({})),
}));
vi.mock("../clipboard", () => ({ probablySupportsClipboardBlob: true }));

const setup = (appStateOverrides: Record<string, unknown> = {}) => {
  const onExportImage = vi.fn().mockResolvedValue(undefined);
  const onCloseRequest = vi.fn();
  const executeAction = vi.fn();
  const appState = {
    exportBackground: true,
    exportEmbedScene: false,
    exportScale: 1,
    exportWithDarkMode: false,
    selectedElementIds: {},
    selectedGroupIds: {},
    frameToHighlight: null,
    ...appStateOverrides,
  };
  render(Harness, {
    component: ImageExportDialog,
    componentProps: {
      elements: [],
      appState,
      files: {},
      actionManager: { executeAction },
      onExportImage,
      onCloseRequest,
      name: "my-scene",
    },
    ctx: makeDialogCtx(),
  });
  return { onExportImage, executeAction, onCloseRequest };
};

describe("ImageExportDialog", () => {
  it("renders the settings with their initial values", () => {
    setup({ exportScale: 2, exportEmbedScene: true });
    expect(screen.getAllByText("Export image").length).toBeGreaterThan(0);
    expect(
      document.querySelector<HTMLInputElement>("#exportBackgroundSwitch")!
        .checked,
    ).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>("#exportEmbedSwitch")!.checked,
    ).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>("#exportDarkModeSwitch")!
        .checked,
    ).toBe(false);
    // nothing is selected, so the "only selected" option is absent
    expect(document.querySelector("#exportOnlySelected")).toBeNull();
  });

  it("exports to PNG and SVG with the prepared elements", async () => {
    const { onExportImage } = setup();
    await fireEvent.click(screen.getByLabelText("Export to PNG"));
    expect(onExportImage).toHaveBeenLastCalledWith(
      EXPORT_IMAGE_TYPES.png,
      [],
      expect.objectContaining({ exportingFrame: null }),
    );
    await fireEvent.click(screen.getByLabelText("Export to SVG"));
    expect(onExportImage).toHaveBeenLastCalledWith(
      EXPORT_IMAGE_TYPES.svg,
      [],
      expect.anything(),
    );
  });

  it("copies to the clipboard and shows the success status", async () => {
    const { onExportImage } = setup();
    await fireEvent.click(screen.getByLabelText("Copy PNG to clipboard"));
    expect(onExportImage).toHaveBeenCalledWith(
      EXPORT_IMAGE_TYPES.clipboard,
      [],
      expect.anything(),
    );
    await vi.waitFor(() =>
      expect(document.querySelector(".ExcButton--status-success")).not.toBeNull(),
    );
  });

  it("forwards setting changes to the export actions", async () => {
    const { executeAction } = setup();
    await fireEvent.change(document.querySelector("#exportBackgroundSwitch")!);
    expect(executeAction).toHaveBeenCalledWith(
      { name: "changeExportBackground" },
      "ui",
      false,
    );
    await fireEvent.change(document.querySelector("#exportDarkModeSwitch")!);
    expect(executeAction).toHaveBeenCalledWith(
      { name: "exportWithDarkMode" },
      "ui",
      true,
    );
    await fireEvent.change(document.querySelector("#exportEmbedSwitch")!);
    expect(executeAction).toHaveBeenCalledWith(
      { name: "changeExportEmbedScene" },
      "ui",
      true,
    );
  });
});
