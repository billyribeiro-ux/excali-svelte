import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@svelte-draw/element/types";

import type { CaptureUpdateActionType } from "@svelte-draw/element";

import type {
  AppClassProperties,
  AppState,
  SvelteDrawProps,
  BinaryFiles,
  UIAppState,
} from "../types";
import type { Component } from "svelte";

import type { IconDef } from "../components/icons";

export type ActionSource =
  | "ui"
  | "keyboard"
  | "contextMenu"
  | "api"
  | "commandPalette";

/** if false, the action should be prevented */
export type ActionResult =
  | {
      elements?: readonly ExcalidrawElement[] | null;
      appState?: Partial<AppState> | null;
      files?: BinaryFiles | null;
      captureUpdate: CaptureUpdateActionType;
      replaceFiles?: boolean;
    }
  | false;

type ActionFn<TData = any> = (
  elements: readonly OrderedExcalidrawElement[],
  appState: Readonly<AppState>,
  formData: TData | undefined,
  app: AppClassProperties,
) => ActionResult | Promise<ActionResult>;

export type UpdaterFn = (res: ActionResult) => void;
export type ActionFilterFn = (action: Action) => void;

export type ActionName =
  | "copy"
  | "cut"
  | "paste"
  | "copyAsPng"
  | "copyAsSvg"
  | "copyText"
  | "sendBackward"
  | "bringForward"
  | "sendToBack"
  | "bringToFront"
  | "copyStyles"
  | "selectAll"
  | "pasteStyles"
  | "gridMode"
  | "zenMode"
  | "objectsSnapMode"
  | "arrowBinding"
  | "midpointSnapping"
  | "showHints"
  | "stats"
  | "changeStrokeColor"
  | "changeBackgroundColor"
  | "changeBucketFillBackgroundColor"
  | "changeFillStyle"
  | "changeStrokeWidth"
  | "changeSloppiness"
  | "changeFreedrawMode"
  | "changeStrokeStyle"
  | "changeArrowhead"
  | "changeArrowType"
  | "changeArrowProperties"
  | "changeOpacity"
  | "changeFontSize"
  | "undo"
  | "redo"
  | "finalize"
  | "changeProjectName"
  | "changeExportBackground"
  | "changeExportEmbedScene"
  | "changeExportScale"
  | "saveToActiveFile"
  | "saveFileToDisk"
  | "loadScene"
  | "duplicateSelection"
  | "deleteSelectedElements"
  | "changeViewBackgroundColor"
  | "clearCanvas"
  | "zoomIn"
  | "zoomOut"
  | "resetZoom"
  | "zoomToFit"
  | "zoomToFitSelection"
  | "zoomToFitSelectionInViewport"
  | "changeFontFamily"
  | "changeTextAlign"
  | "changeVerticalAlign"
  | "toggleFullScreen"
  | "toggleShortcuts"
  | "group"
  | "ungroup"
  | "goToCollaborator"
  | "addToLibrary"
  | "changeRoundness"
  | "alignTop"
  | "alignBottom"
  | "alignLeft"
  | "alignRight"
  | "alignVerticallyCentered"
  | "alignHorizontallyCentered"
  | "distributeHorizontally"
  | "distributeVertically"
  | "flipHorizontal"
  | "flipVertical"
  | "deselect"
  | "viewMode"
  | "exportWithDarkMode"
  | "toggleTheme"
  | "increaseFontSize"
  | "decreaseFontSize"
  | "unbindText"
  | "hyperlink"
  | "bindText"
  | "unlockAllElements"
  | "toggleElementLock"
  | "toggleLinearEditor"
  | "selectAllElementsInFrame"
  | "removeAllElementsFromFrame"
  | "updateFrameRendering"
  | "createContainerFromText"
  | "wrapTextInContainer"
  | "commandPalette"
  | "autoResize"
  | "elementStats"
  | "searchMenu"
  | "copyElementLink"
  | "linkToElement"
  | "cropEditor"
  | "wrapSelectionInFrame"
  | "toggleWrap"
  | "toggleShapeSwitch"
  | "togglePolygon";

/**
 * Props of an action's Svelte `PanelComponent`. `renderAction` of the React
 * version is replaced by rendering `<ActionPanel name={...} data={...} />`
 * (`actions/ActionPanel.svelte`).
 */
export type ActionPanelProps = {
  elements: readonly ExcalidrawElement[];
  // UIAppState (not AppState) because panels only re-render when the UI does
  // — reading UI-stripped props (zoom, scroll, …) would render stale values;
  // subscribe via useAppStateValue for those instead
  appState: UIAppState;
  updateData: <T = any>(formData?: T) => void;
  appProps: SvelteDrawProps;
  data?: Record<string, any>;
  app: AppClassProperties;
};

/** @deprecated alias kept for code written against the React name */
export type PanelComponentProps = ActionPanelProps;

export interface Action<TData = any> {
  name: ActionName;
  label:
    | string
    | ((
        elements: readonly ExcalidrawElement[],
        appState: Readonly<UIAppState>,
        app: AppClassProperties,
      ) => string);
  keywords?: string[];
  icon?:
    | IconDef
    | ((
        appState: UIAppState,
        elements: readonly ExcalidrawElement[],
      ) => IconDef)
    | null;
  PanelComponent?: Component<ActionPanelProps>;
  perform: ActionFn<TData>;
  keyPriority?: number;
  keyTest?: (
    event: KeyboardEvent,
    appState: AppState,
    elements: readonly ExcalidrawElement[],
    app: AppClassProperties,
  ) => boolean;
  predicate?: (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    appProps: SvelteDrawProps,
    app: AppClassProperties,
  ) => boolean;
  checked?: (appState: Readonly<UIAppState>) => boolean;
  trackEvent:
    | false
    | {
        category:
          | "toolbar"
          | "element"
          | "canvas"
          | "export"
          | "history"
          | "menu"
          | "collab"
          | "hyperlink"
          | "search_menu"
          | "shape_switch";
        action?: string;
        predicate?: (
          appState: Readonly<AppState>,
          elements: readonly ExcalidrawElement[],
          value: any,
        ) => boolean;
      };
  /** if set to `true`, allow action to be performed in viewMode.
   *  Defaults to `false` */
  viewMode?: boolean;
  /** if set to `true`, the action counts as canvas navigation and remains
   *  available in the non-interactive editor when
   *  `interaction: { enabled: { navigation: true } }`. Defaults to `false` */
  navigation?: boolean;
}
