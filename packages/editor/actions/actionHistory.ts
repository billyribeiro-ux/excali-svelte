import {
  KEYS,
  matchKey,
  arrayToMap,
} from "@svelte-draw/common";

import { CaptureUpdateAction } from "@svelte-draw/element";

import { orderByFractionalIndex } from "@svelte-draw/element";

import type { Component } from "svelte";

import type { SceneElementsMap } from "@svelte-draw/element/types";

import { UndoIcon, RedoIcon } from "../components/icons";
import RedoPanel from "./panels/RedoPanel.svelte";
import UndoPanel from "./panels/UndoPanel.svelte";
import { setHistoryContext } from "./panels/historyContext";

import type { History } from "../history";
import type { AppClassProperties, AppState } from "../types";
import type { Action, ActionPanelProps, ActionResult } from "./types";

const executeHistoryAction = (
  app: AppClassProperties,
  appState: Readonly<AppState>,
  updater: () => [SceneElementsMap, AppState] | void,
): ActionResult => {
  if (
    !appState.multiElement &&
    !appState.resizingElement &&
    !appState.editingTextElement &&
    !appState.newElement &&
    !appState.selectedElementsAreBeingDragged &&
    !appState.selectionElement &&
    !app.flowchart.isCreatingChart &&
    // a drawShape sketch in progress isn't visible via `newElement` while
    // the stroke is still unrecognized — block history mid-gesture the same
    // way as for the other in-progress interactions above
    !app.drawShape.hasPendingGesture()
  ) {
    const result = updater();

    if (!result) {
      return { captureUpdate: CaptureUpdateAction.EVENTUALLY };
    }

    const [nextElementsMap, nextAppState] = result;

    // order by fractional indices in case the map was accidently modified in the meantime
    const nextElements = orderByFractionalIndex(
      Array.from(nextElementsMap.values()),
    );

    return {
      appState: nextAppState,
      elements: nextElements,
      captureUpdate: CaptureUpdateAction.NEVER,
    };
  }

  return { captureUpdate: CaptureUpdateAction.EVENTUALLY };
};

/**
 * Wraps a panel so it renders with the `History` instance in context (the
 * undo/redo actions are created per history, the panel props are not).
 */
const createHistoryPanel = (
  history: History,
  Panel: Component<ActionPanelProps>,
): Component<ActionPanelProps> =>
  ((anchor: any, props: ActionPanelProps) => {
    setHistoryContext(history);
    return Panel(anchor, props);
  }) as Component<ActionPanelProps>;

type ActionCreator = (history: History) => Action;

export const createUndoAction: ActionCreator = (history) => ({
  name: "undo",
  label: "buttons.undo",
  icon: UndoIcon,
  trackEvent: { category: "history" },
  viewMode: false,
  perform: (elements, appState, value, app) =>
    executeHistoryAction(app, appState, () =>
      history.undo(arrayToMap(elements) as SceneElementsMap, appState),
    ),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] && matchKey(event, KEYS.Z) && !event.shiftKey,
  PanelComponent: createHistoryPanel(history, UndoPanel),
});

export const createRedoAction: ActionCreator = (history) => ({
  name: "redo",
  label: "buttons.redo",
  icon: RedoIcon,
  trackEvent: { category: "history" },
  viewMode: false,
  perform: (elements, appState, __, app) =>
    executeHistoryAction(app, appState, () =>
      history.redo(arrayToMap(elements) as SceneElementsMap, appState),
    ),
  keyTest: (event) =>
    (event[KEYS.CTRL_OR_CMD] && event.shiftKey && matchKey(event, KEYS.Z)) ||
    (event[KEYS.CTRL_OR_CMD] && !event.shiftKey && matchKey(event, KEYS.Y)),
  PanelComponent: createHistoryPanel(history, RedoPanel),
});
