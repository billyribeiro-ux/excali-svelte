import { updateFrameMembershipOfSelectedElements } from "@svelte-draw/element";

import { KEYS, arrayToMap } from "@svelte-draw/common";

import { alignElements } from "@svelte-draw/element";

import { CaptureUpdateAction } from "@svelte-draw/element";

import type { ExcalidrawElement } from "@svelte-draw/element/types";

import type { Alignment } from "@svelte-draw/element";

import {
  AlignBottomIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  CenterHorizontallyIcon,
  CenterVerticallyIcon,
} from "../components/icons";

import { alignActionsPredicate } from "./panels/predicates";
import AlignTopPanel from "./panels/AlignTopPanel.svelte";
import AlignBottomPanel from "./panels/AlignBottomPanel.svelte";
import AlignLeftPanel from "./panels/AlignLeftPanel.svelte";
import AlignRightPanel from "./panels/AlignRightPanel.svelte";
import AlignVerticallyCenteredPanel from "./panels/AlignVerticallyCenteredPanel.svelte";
import AlignHorizontallyCenteredPanel from "./panels/AlignHorizontallyCenteredPanel.svelte";

import { register } from "./register";

import type { AppClassProperties, AppState } from "../types";

const alignSelectedElements = (
  elements: readonly ExcalidrawElement[],
  appState: Readonly<AppState>,
  app: AppClassProperties,
  alignment: Alignment,
) => {
  const selectedElements = app.scene.getSelectedElements(appState);

  const updatedElements = alignElements(
    selectedElements,
    alignment,
    app.scene,
    appState,
  );

  const updatedElementsMap = arrayToMap(updatedElements);

  return updateFrameMembershipOfSelectedElements(
    elements.map((element) => updatedElementsMap.get(element.id) || element),
    appState,
    app,
  );
};

export const actionAlignTop = register({
  name: "alignTop",
  label: "labels.alignTop",
  icon: AlignTopIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, appProps, app) =>
    alignActionsPredicate(appState, app),
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: alignSelectedElements(elements, appState, app, {
        position: "start",
        axis: "y",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_UP,
  PanelComponent: AlignTopPanel,
});

export const actionAlignBottom = register({
  name: "alignBottom",
  label: "labels.alignBottom",
  icon: AlignBottomIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, appProps, app) =>
    alignActionsPredicate(appState, app),
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: alignSelectedElements(elements, appState, app, {
        position: "end",
        axis: "y",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_DOWN,
  PanelComponent: AlignBottomPanel,
});

export const actionAlignLeft = register({
  name: "alignLeft",
  label: "labels.alignLeft",
  icon: AlignLeftIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, appProps, app) =>
    alignActionsPredicate(appState, app),
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: alignSelectedElements(elements, appState, app, {
        position: "start",
        axis: "x",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_LEFT,
  PanelComponent: AlignLeftPanel,
});

export const actionAlignRight = register({
  name: "alignRight",
  label: "labels.alignRight",
  icon: AlignRightIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, appProps, app) =>
    alignActionsPredicate(appState, app),
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: alignSelectedElements(elements, appState, app, {
        position: "end",
        axis: "x",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && event.shiftKey && event.key === KEYS.ARROW_RIGHT,
  PanelComponent: AlignRightPanel,
});

export const actionAlignVerticallyCentered = register({
  name: "alignVerticallyCentered",
  label: "labels.centerVertically",
  icon: CenterVerticallyIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, appProps, app) =>
    alignActionsPredicate(appState, app),
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: alignSelectedElements(elements, appState, app, {
        position: "center",
        axis: "y",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  PanelComponent: AlignVerticallyCenteredPanel,
});

export const actionAlignHorizontallyCentered = register({
  name: "alignHorizontallyCentered",
  label: "labels.centerHorizontally",
  icon: CenterHorizontallyIcon,
  trackEvent: { category: "element" },
  predicate: (elements, appState, appProps, app) =>
    alignActionsPredicate(appState, app),
  perform: (elements, appState, _, app) => {
    return {
      appState,
      elements: alignSelectedElements(elements, appState, app, {
        position: "center",
        axis: "x",
      }),
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  PanelComponent: AlignHorizontallyCenteredPanel,
});

export { alignActionsPredicate };
