import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { makeDialogCtx } from "./dialogTestUtils";
import Harness from "./DialogContextHarness.test.svelte";
import PasteChartDialog from "./PasteChartDialog.svelte";

import type { Spreadsheet } from "../charts";

vi.mock("../analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../scene/export", () => ({
  exportScene: vi.fn(async () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("data-testid", "preview-svg");
    return svg;
  }),
}));

const twoColumn: Spreadsheet = {
  title: "Users",
  labels: ["Week 1", "Week 2", "Week 3"],
  series: [{ title: "Users", values: [814, 10301, 4264] }],
};

const setup = (data: Spreadsheet, rawText = "") => {
  const ctx = makeDialogCtx();
  const onClose = vi.fn();
  render(Harness, {
    component: PasteChartDialog,
    componentProps: { data, rawText, onClose },
    ctx,
  });
  return { ctx, onClose };
};

describe("PasteChartDialog", () => {
  it("offers the valid chart types and a plain-text option", async () => {
    setup(twoColumn, "Week 1\t814");
    expect(screen.getByLabelText("Bar chart")).toBeInTheDocument();
    expect(screen.getByLabelText("Line chart")).toBeInTheDocument();
    // radar needs at least three dimensions (labels)
    expect(screen.getByLabelText("Radar chart")).toBeInTheDocument();
    expect(screen.getByLabelText("Plain text")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        document.querySelectorAll(".ChartPreview__canvas svg").length,
      ).toBe(4),
    );
  });

  it("omits the radar chart for fewer than three dimensions", () => {
    setup({
      title: "Users",
      labels: ["Week 1", "Week 2"],
      series: [{ title: "Users", values: [1, 2] }],
    });
    expect(screen.getByLabelText("Bar chart")).toBeInTheDocument();
    expect(screen.queryByLabelText("Radar chart")).toBeNull();
  });

  it("omits the plain-text option when there is no raw text", () => {
    setup(twoColumn);
    expect(screen.queryByLabelText("Plain text")).toBeNull();
  });

  it("inserts the chart, closes and refocuses the editor on click", async () => {
    const { ctx, onClose } = setup(twoColumn);
    await fireEvent.click(screen.getByLabelText("Bar chart"));
    expect(ctx.app.onInsertElements).toHaveBeenCalledTimes(1);
    const inserted = (ctx.app.onInsertElements as any).mock.calls[0][0];
    expect(inserted.length).toBeGreaterThan(0);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(ctx.app.focusContainer).toHaveBeenCalledTimes(1);
  });

  it("inserts a text element for the plain-text option", async () => {
    const { ctx, onClose } = setup(twoColumn, "hello");
    await fireEvent.click(screen.getByLabelText("Plain text"));
    const inserted = (ctx.app.onInsertElements as any).mock.calls[0][0];
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ type: "text", text: "hello" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("reshuffle button is keyboard accessible", async () => {
    setup(twoColumn);
    const btn = document.querySelector(
      ".PasteChartDialog__reshuffleBtn",
    ) as HTMLElement;
    expect(btn).toHaveAttribute("role", "button");
    expect(btn).toHaveAttribute("tabindex", "0");
    await fireEvent.keyDown(btn, { key: "Enter" });
    await fireEvent.keyDown(btn, { key: " " });
    expect(screen.getByLabelText("Bar chart")).toBeInTheDocument();
  });
});
