import { fireEvent } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";

import { ROUNDNESS } from "@svelte-draw/common";
import { Scene, syncInvalidIndices } from "@svelte-draw/element";

import { getDefaultAppState } from "../appState";

import {
  convertElementTypePopupAtom,
  convertElementTypes,
  getConversionTypeFromElements,
} from "./ConvertElementTypePopup";
import ConvertElementTypePopup from "./ConvertElementTypePopup.svelte";
import {
  createFakeEditorContext,
  makeElement,
  makeLinear,
  renderWithEditorContext,
} from "./overlayTestUtils";

const createApp = (elements: any[], selectedIds: string[]) => {
  const scene = new Scene();
  scene.replaceAllElements(syncInvalidIndices(elements));
  const state: any = {
    ...getDefaultAppState(),
    width: 1000,
    height: 800,
    offsetLeft: 0,
    offsetTop: 0,
    selectedElementIds: Object.fromEntries(selectedIds.map((id) => [id, true])),
  };
  const app: any = {
    scene,
    state,
    renderEnvironment: undefined,
    updateEditorAtom: vi.fn(),
    setState: (update: any) => {
      Object.assign(
        state,
        typeof update === "function" ? update(state) : update,
      );
    },
  };
  return { app, scene, state };
};

describe("getConversionTypeFromElements", () => {
  it("classifies generic, linear and unsupported selections", () => {
    const rect = makeElement({ type: "rectangle" });
    const line = makeLinear({ type: "line" });
    expect(getConversionTypeFromElements([])).toBeNull();
    expect(getConversionTypeFromElements([rect])).toBe("generic");
    expect(getConversionTypeFromElements([line])).toBe("linear");
    // generic has preference in mixed selections
    expect(getConversionTypeFromElements([line, rect])).toBe("generic");
    expect(
      getConversionTypeFromElements([makeElement({ type: "embeddable" })]),
    ).toBeNull();
  });
});

describe("convertElementTypes", () => {
  // #9662
  it("recalculates roundness type when switching between generic shapes", () => {
    const rectangle = makeElement({
      type: "rectangle",
      roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    });
    const { app, scene } = createApp([rectangle], [rectangle.id]);

    convertElementTypes(app, {
      conversionType: "generic",
      nextType: "diamond",
    });
    expect(scene.getNonDeletedElements()[0].type).toBe("diamond");
    expect(scene.getNonDeletedElements()[0].roundness?.type).toBe(
      ROUNDNESS.PROPORTIONAL_RADIUS,
    );

    convertElementTypes(app, {
      conversionType: "generic",
      nextType: "rectangle",
    });
    expect(scene.getNonDeletedElements()[0].type).toBe("rectangle");
    expect(scene.getNonDeletedElements()[0].roundness?.type).toBe(
      ROUNDNESS.ADAPTIVE_RADIUS,
    );
  });

  it("cycles through generic types when no nextType is given", () => {
    const rectangle = makeElement({ type: "rectangle" });
    const { app, scene } = createApp([rectangle], [rectangle.id]);
    convertElementTypes(app, { conversionType: "generic" });
    expect(scene.getNonDeletedElements()[0].type).toBe("diamond");
    convertElementTypes(app, { conversionType: "generic", direction: "left" });
    expect(scene.getNonDeletedElements()[0].type).toBe("rectangle");
  });

  it("returns false without a conversion type", () => {
    const { app } = createApp([], []);
    expect(convertElementTypes(app, { conversionType: null })).toBe(false);
  });
});

describe("ConvertElementTypePopup component", () => {
  const mount = (elements: any[], selectedIds: string[]) => {
    const { app, scene, state } = createApp(elements, selectedIds);
    const fake = createFakeEditorContext({
      app,
      appState: state,
      elements,
    });
    const view = renderWithEditorContext(
      ConvertElementTypePopup,
      { app },
      fake.ctx,
    );
    return { ...view, app, scene, fake };
  };

  it("renders the generic shape switcher with the current type checked", async () => {
    const rect = makeElement({ type: "rectangle" });
    const { container, getByTestId } = mount([rect], [rect.id]);
    await tick();
    expect(container.querySelector(".ConvertElementTypePopup")).not.toBeNull();
    for (const type of ["rectangle", "diamond", "ellipse"]) {
      expect(getByTestId(`toolbar-${type}`)).toHaveAttribute(
        "aria-label",
        type,
      );
    }
    expect(getByTestId("toolbar-rectangle")).toHaveClass("ToolIcon--checked");
    expect(getByTestId("toolbar-diamond")).not.toHaveClass("ToolIcon--checked");
  });

  it("converts the selection when another type is picked", async () => {
    const rect = makeElement({ type: "rectangle" });
    const { getByTestId, scene } = mount([rect], [rect.id]);
    await tick();
    await fireEvent.click(getByTestId("toolbar-ellipse"));
    expect(scene.getNonDeletedElements()[0].type).toBe("ellipse");
  });

  it("offers the linear switcher for lines", async () => {
    const line = makeLinear({ type: "line" });
    const { getByTestId, queryByTestId } = mount([line], [line.id]);
    await tick();
    for (const type of ["line", "sharpArrow", "curvedArrow", "elbowArrow"]) {
      expect(getByTestId(`toolbar-${type}`)).toBeInTheDocument();
    }
    expect(queryByTestId("toolbar-rectangle")).toBeNull();
  });

  it("closes the panel when the selection is emptied", async () => {
    const rect = makeElement({ type: "rectangle" });
    const { app } = mount([rect], []);
    await tick();
    expect(app.updateEditorAtom).toHaveBeenCalledWith(
      convertElementTypePopupAtom,
      null,
    );
  });
});
