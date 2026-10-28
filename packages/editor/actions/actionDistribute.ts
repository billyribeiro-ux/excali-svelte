import { CODES, KEYS, arrayToMap } from "@svelte-draw/common";

import { updateFrameMembershipOfSelectedElements } from "@svelte-draw/element";

import { distributeElements } from "@svelte-draw/element";

import { CaptureUpdateAction } from "@svelte-draw/element";

import type { ExcalidrawElement } from "@svelte-draw/element/types";

import type { Distribution } from "@svelte-draw/element";

import DistributeHorizontallyPanel from "./panels/DistributeHorizontallyPanel.svelte";
import DistributeVerticallyPanel from "./panels/DistributeVerticallyPanel.svelte";

import { register } from "./register";

import type { AppClassProperties, AppState } from "../types";

const distributeSelectedElements = (
  elements: readonly ExcalidrawElement[],
  appState: Readonly<AppState>,
  app: AppClassProperties,
  distribution: Distribution,
) => {
  const selectedElements = app.scene.getSelectedElements(appState);

  const updatedElements = distributeElements(
    selectedElements,
    app.scene.getNonDeletedElementsMap(),
    distribution,
    appState,
    app.scene,
  );

  const updatedElementsMap = arrayToMap(updatedElements);

  return updateFrameMembershipOfSelectedElements(
    elements.map((element) => updatedElementsMap.get(element.id) || element),
    appState,
    app,
  );
};

export const distributeHorizontally = register({
  name: "distributeHorizontally",
  label: "labels.distributeHorizontally",
  trackEvent: { category: "element" },
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: distributeSelectedElements(elements, appState, app, {
        space: "between",
        axis: "x",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.H,
  PanelComponent: DistributeHorizontallyPanel,
});

export const distributeVertically = register({
  name: "distributeVertically",
  label: "labels.distributeVertically",
  trackEvent: { category: "element" },
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: distributeSelectedElements(elements, appState, app, {
        space: "between",
        axis: "y",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.V,
  PanelComponent: DistributeVerticallyPanel,
});
