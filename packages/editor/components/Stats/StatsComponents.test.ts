import { fireEvent, render, screen } from "@testing-library/svelte";
import { createRawSnippet, tick } from "svelte";
import { describe, expect, it, vi } from "vitest";

import { STATS_PANELS } from "@svelte-draw/common";
import type { newElement} from "@svelte-draw/element";
import { Scene, syncInvalidIndices } from "@svelte-draw/element";

import { getDefaultAppState } from "../../appState";
import {
  createFakeEditorContext,
  makeElement,
  renderWithEditorContext,
} from "../overlayTestUtils";

import Collapsible from "./Collapsible.svelte";
import DragInput from "./DragInput.svelte";
import StatsComponent from "./Stats.svelte";
import StatsRow from "./StatsRow.svelte";
import StatsRows from "./StatsRows.svelte";
import { Stats, StatsRow as ExportedStatsRow } from "./index";
import {
  getAtomicUnits,
  getStepSizedValue,
  isPropertyEditable,
  newOrigin,
} from "./utils";

const text = (value: string) =>
  createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

describe("step sized value", () => {
  it("should return edge values correctly", () => {
    const steps = [10, 15, 20, 25, 30];
    const values = [10, 15, 20, 25, 30];

    steps.forEach((step, idx) => {
      expect(getStepSizedValue(values[idx], step)).toEqual(values[idx]);
    });
  });

  it("step sized value lies in the middle", () => {
    let stepSize = 15;
    let values = [7.5, 9, 12, 14.99, 15, 22.49];

    values.forEach((value) => {
      expect(getStepSizedValue(value, stepSize)).toEqual(15);
    });

    stepSize = 10;
    values = [-5, 4.99, 0, 1.23];
    values.forEach((value) => {
      expect(getStepSizedValue(value, stepSize)).toEqual(0);
    });
  });
});

describe("stats utils", () => {
  it("newOrigin keeps the origin when the size is unchanged", () => {
    expect(newOrigin(10, 20, 100, 50, 100, 50, 0.3)).toEqual({ x: 10, y: 20 });
  });

  it("frames can't be rotated from stats", () => {
    expect(
      isPropertyEditable(makeElement({ type: "frame" } as any), "angle"),
    ).toBe(false);
    expect(
      isPropertyEditable(makeElement({ type: "rectangle" }), "angle"),
    ).toBe(true);
  });

  it("getAtomicUnits treats a group as one unit", () => {
    const a = makeElement({ type: "rectangle", groupIds: ["g"] });
    const b = makeElement({ type: "rectangle", groupIds: ["g"] });
    const c = makeElement({ type: "rectangle" });
    const units = getAtomicUnits([a, b, c], {
      ...getDefaultAppState(),
      selectedGroupIds: { g: true },
    } as any);
    expect(units).toEqual([{ [a.id]: true, [b.id]: true }, { [c.id]: true }]);
  });
});

describe("Stats exports", () => {
  it("exposes the stats building blocks for custom stats", () => {
    expect(Stats).toBe(StatsComponent);
    expect(ExportedStatsRow).toBe(StatsRow);
  });
});

describe("StatsRow / StatsRows", () => {
  it("renders a grid row with the requested columns", () => {
    const { container } = render(StatsRow, {
      columns: 2,
      heading: true,
      style: "margin: 1px;",
      "data-testid": "row",
      children: text("x"),
    });
    const row = container.querySelector<HTMLElement>(".exc-stats__row")!;
    expect(row).toHaveClass("exc-stats__row--heading");
    expect(row.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
    expect(row.style.margin).toBe("1px");
    expect(row).toHaveAttribute("data-testid", "row");
  });

  it("renders the rows wrapper with order", () => {
    const { container } = render(StatsRows, {
      order: 3,
      children: text("x"),
    });
    const rows = container.querySelector<HTMLElement>(".exc-stats__rows")!;
    expect(rows.style.order).toBe("3");
  });
});

describe("Collapsible", () => {
  it("renders children only while open and triggers on click", async () => {
    const openTrigger = vi.fn();
    const { container, rerender } = render(Collapsible, {
      label: text("label"),
      open: false,
      openTrigger,
      children: text("content"),
    });
    expect(screen.queryByText("content")).toBeNull();
    await fireEvent.click(screen.getByText("label"));
    expect(openTrigger).toHaveBeenCalledTimes(1);

    await rerender({ open: true });
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(container.querySelectorAll("svg").length).toBe(1);
  });

  it("can hide the collapse icon", () => {
    const { container } = render(Collapsible, {
      label: text("label"),
      open: true,
      openTrigger: () => {},
      showCollapsedIcon: false,
      children: text("content"),
    });
    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("DragInput", () => {
  const mountInput = (props: Record<string, any> = {}) => {
    const scene = new Scene();
    const app: any = {
      scene,
      ownerWindow: window,
      ownerDocument: document,
      syncActionResult: vi.fn(),
      focusContainer: vi.fn(),
    };
    const fake = createFakeEditorContext({ app });
    const dragInputCallback = vi.fn();
    const view = renderWithEditorContext(
      DragInput as any,
      {
        label: "X",
        value: 10,
        elements: [],
        property: "x",
        scene,
        appState: fake.ctx.appState,
        dragInputCallback,
        ...props,
      },
      fake.ctx,
    );
    const input = () => view.container.querySelector<HTMLInputElement>("input")!;
    return { ...view, app, dragInputCallback, input, fake, scene };
  };

  it("renders the label and the current value", () => {
    const { container, input } = mountInput({ value: 12.5 });
    expect(container.querySelector("[data-testid='X']")).not.toBeNull();
    expect(container.querySelector(".drag-input-label")).toHaveTextContent("X");
    expect(input().value).toBe("12.5");
  });

  it("renders the icon instead of the label when given", () => {
    const { container } = mountInput({
      icon: { html: '<svg data-testid="ic"></svg>' },
    });
    expect(
      container.querySelector(".drag-input-label svg[data-testid='ic']"),
    ).not.toBeNull();
  });

  it("renders nothing when not editable", () => {
    const { container } = mountInput({ editable: false });
    expect(container.querySelector(".drag-input-container")).toBeNull();
  });

  it("applies a typed value on Enter, rounded to two decimals", async () => {
    const { input, dragInputCallback, app } = mountInput();
    await fireEvent.input(input(), { target: { value: "20.456" } });
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(dragInputCallback).toHaveBeenCalledTimes(1);
    expect(dragInputCallback.mock.calls[0][0]).toMatchObject({
      nextValue: 20.46,
      property: "x",
      accumulatedChange: 0,
      shouldChangeByStepSize: false,
    });
    expect(app.syncActionResult).toHaveBeenCalledTimes(1);
    expect(app.focusContainer).toHaveBeenCalled();
  });

  it("applies a typed value on blur", async () => {
    const { input, dragInputCallback } = mountInput();
    await fireEvent.input(input(), { target: { value: "30" } });
    await fireEvent.blur(input());
    expect(dragInputCallback).toHaveBeenCalledTimes(1);
    expect(dragInputCallback.mock.calls[0][0].nextValue).toBe(30);
  });

  it("ignores changes smaller than the smallest delta", async () => {
    const { input, dragInputCallback } = mountInput({ value: 10 });
    await fireEvent.input(input(), { target: { value: "10.001" } });
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(dragInputCallback).not.toHaveBeenCalled();
  });

  it("rejects non-finite values and restores the previous one", async () => {
    const { input, dragInputCallback } = mountInput({ value: 10 });
    for (const bad of ["abc", "Infinity", "1e999"]) {
      await fireEvent.input(input(), { target: { value: bad } });
      await fireEvent.keyDown(input(), { key: "Enter" });
      expect(input().value).toBe("10");
    }
    expect(dragInputCallback).not.toHaveBeenCalled();
  });

  it("restores the value when the input is blurred empty", async () => {
    const { input } = mountInput({ value: 10 });
    await fireEvent.input(input(), { target: { value: "" } });
    await fireEvent.blur(input());
    expect(input().value).toBe("10");
  });

  it("follows the value prop", async () => {
    const { input, rerender } = mountInput({ value: 10 });
    await rerender({ value: 42 });
    expect(input().value).toBe("42");
  });

  it("shows Mixed", () => {
    const { input } = mountInput({ value: "Mixed" });
    expect(input().value).toBe("Mixed");
  });

  it("commits a pending typed value when unmounted (e.g. click on canvas)", async () => {
    const { input, dragInputCallback, unmount } = mountInput();
    await fireEvent.input(input(), { target: { value: "50" } });
    unmount();
    expect(dragInputCallback).toHaveBeenCalledTimes(1);
    expect(dragInputCallback.mock.calls[0][0].nextValue).toBe(50);
  });

  it("changes the value by dragging the label", async () => {
    const scene = new Scene();
    const rect = makeElement({ type: "rectangle", x: 0, y: 0 });
    scene.replaceAllElements(syncInvalidIndices([rect]));
    const dragFinishedCallback = vi.fn();
    const { dragInputCallback, container, app } = mountInput({
      scene,
      elements: [rect],
      dragFinishedCallback,
      sensitivity: 2,
    });
    app.scene = scene;
    const label = container.querySelector(".drag-input-label")!;

    await fireEvent.pointerDown(label, { clientX: 0 });
    expect(document.body).toHaveClass("excalidraw-cursor-resize");
    await fireEvent.pointerMove(window, { clientX: 0 });
    await fireEvent.pointerMove(window, { clientX: 1 });
    // below the sensitivity: nothing yet
    expect(dragInputCallback).not.toHaveBeenCalled();
    await fireEvent.pointerMove(window, { clientX: 4 });
    expect(dragInputCallback).toHaveBeenCalledTimes(1);
    expect(dragInputCallback.mock.calls[0][0]).toMatchObject({
      accumulatedChange: 2,
      instantChange: 2,
    });

    await fireEvent.pointerUp(window);
    expect(document.body).not.toHaveClass("excalidraw-cursor-resize");
    expect(app.syncActionResult).toHaveBeenCalledTimes(1);
    expect(dragFinishedCallback).toHaveBeenCalledTimes(1);
  });
});

describe("Stats", () => {
  const mountStats = (
    elements: ReturnType<typeof newElement>[],
    selectedIds: string[],
    extra: Record<string, any> = {},
  ) => {
    const scene = new Scene();
    scene.replaceAllElements(syncInvalidIndices(elements));
    const fake = createFakeEditorContext({
      appState: {
        selectedElementIds: Object.fromEntries(
          selectedIds.map((id) => [id, true]),
        ),
        stats: {
          open: true,
          panels: STATS_PANELS.generalStats | STATS_PANELS.elementProperties,
        },
      },
    });
    const app: any = {
      scene,
      get state() {
        return fake.ctx.appState;
      },
      props: {},
      ownerWindow: window,
      ownerDocument: document,
      syncActionResult: vi.fn(),
      focusContainer: vi.fn(),
      renderEnvironment: undefined,
    };
    (fake.ctx as any).app = app;
    const onClose = vi.fn();
    const view = renderWithEditorContext(
      StatsComponent,
      { app, onClose, ...extra },
      fake.ctx,
    );
    return { ...view, app, scene, fake, onClose };
  };

  const input = (label: string) =>
    document
      .querySelector(`[data-testid='${label}']`)
      ?.querySelector<HTMLInputElement>(".drag-input") ?? null;

  it("shows the title, scene stats and closes", async () => {
    const a = makeElement({ type: "rectangle", x: 0, y: 0, width: 100, height: 50 });
    const b = makeElement({ type: "rectangle", x: 200, y: 100, width: 100, height: 50 });
    const { container, onClose } = mountStats([a, b], []);
    await tick();
    expect(container.querySelector(".exc-stats h2")).toBeInTheDocument();
    const rows = [...container.querySelectorAll(".exc-stats__row")].map(
      (el) => el.textContent,
    );
    expect(rows.some((text) => /\b2$/.test(text ?? ""))).toBe(true);
    // scene bounding box (throttled, leading call runs immediately)
    expect(rows.some((text) => /\b300$/.test(text ?? ""))).toBe(true);
    expect(rows.some((text) => /\b150$/.test(text ?? ""))).toBe(true);

    await fireEvent.click(container.querySelector(".exc-stats .close")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows no element properties without a selection", async () => {
    const a = makeElement({ type: "rectangle" });
    const { container } = mountStats([a], []);
    await tick();
    expect(container.querySelector("#elementStats")).toBeNull();
  });

  it("shows the properties of a single selected element", async () => {
    const rect = makeElement({
      type: "rectangle",
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
    mountStats([rect], [rect.id]);
    await tick();
    expect(
      document.querySelector("[data-testid='stats-element-type']"),
    ).toBeInTheDocument();
    expect(input("X")!.value).toBe("10");
    expect(input("Y")!.value).toBe("20");
    expect(input("W")!.value).toBe("100");
    expect(input("H")!.value).toBe("50");
    expect(input("A")!.value).toBe("0");
    // not a text element
    expect(input("F")).toBeNull();
  });

  it("edits the position of the selected element", async () => {
    const rect = makeElement({ type: "rectangle", x: 10, y: 20 });
    const { scene, app } = mountStats([rect], [rect.id]);
    await tick();
    await fireEvent.input(input("X")!, { target: { value: "55" } });
    await fireEvent.keyDown(input("X")!, { key: "Enter" });
    await tick();
    expect(scene.getNonDeletedElements()[0].x).toBe(55);
    expect(app.syncActionResult).toHaveBeenCalled();
    // the displayed value follows the scene update
    expect(input("X")!.value).toBe("55");
  });

  it("keeps only two decimal places when editing", async () => {
    const rect = makeElement({ type: "rectangle", x: 10, y: 20 });
    const { scene } = mountStats([rect], [rect.id]);
    await tick();
    await fireEvent.input(input("Y")!, { target: { value: "20.456" } });
    await fireEvent.keyDown(input("Y")!, { key: "Enter" });
    await tick();
    expect(scene.getNonDeletedElements()[0].y).toBe(20.46);
  });

  it("edits the angle in degrees", async () => {
    const rect = makeElement({ type: "rectangle" });
    const { scene } = mountStats([rect], [rect.id]);
    await tick();
    await fireEvent.input(input("A")!, { target: { value: "90" } });
    await fireEvent.keyDown(input("A")!, { key: "Enter" });
    await tick();
    expect(scene.getNonDeletedElements()[0].angle).toBeCloseTo(Math.PI / 2);
  });

  it("shows Mixed for differing values of multiple elements", async () => {
    const a = makeElement({ type: "rectangle", x: 0, y: 0, width: 100, height: 50 });
    const b = makeElement({ type: "rectangle", x: 200, y: 0, width: 100, height: 80 });
    const { container } = mountStats([a, b], [a.id, b.id]);
    await tick();
    expect(input("X")!.value).toBe("Mixed");
    expect(input("Y")!.value).toBe("0");
    expect(input("W")!.value).toBe("100");
    expect(input("H")!.value).toBe("Mixed");
    expect(container.querySelector("#elementStats")).toBeInTheDocument();
  });

  it("collapses a panel through the app state", async () => {
    const rect = makeElement({ type: "rectangle" });
    const { container, fake } = mountStats([rect], [rect.id]);
    await tick();
    const header = container.querySelector("#elementStats h3")!
      .parentElement as HTMLElement;
    await fireEvent.click(header);
    await tick();
    expect(
      fake.ctx.appState.stats.panels & STATS_PANELS.elementProperties,
    ).toBe(0);
    expect(input("X")).toBeNull();
  });

  it("renders custom stats through the snippet", async () => {
    const rect = makeElement({ type: "rectangle" });
    const renderCustomStats = createRawSnippet((elements: () => any[]) => ({
      render: () => `<div data-testid="custom">${elements().length}</div>`,
    }));
    mountStats([rect], [], { renderCustomStats });
    await tick();
    expect(screen.getByTestId("custom")).toHaveTextContent("1");
  });
});
