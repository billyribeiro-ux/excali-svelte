import {
  applyDarkModeFilter,
  getStrokeWidthByKey,
} from "@svelte-draw/common";

import {
  useAppStateValue as _useAppStateValue,
  useOnAppStateChange as _useOnAppStateChange,
} from "./hooks/appStateValue.svelte";
import polyfill from "./polyfill";

import type { AppState } from "./types";

polyfill();

export { default as SvelteDraw } from "./components/SvelteDraw.svelte";
export { default as SvelteDrawAPIProvider } from "./components/SvelteDrawAPIProvider.svelte";

export {
  getSceneVersion,
  hashElementsVersion,
  hashString,
  getNonDeletedElements,
} from "@svelte-draw/element";

export { getTextFromElements } from "@svelte-draw/element";
export { isInvisiblySmallElement } from "@svelte-draw/element";

export { defaultLang, useI18n, languages } from "./i18n";
export {
  restoreAppState,
  restoreElement,
  restoreElements,
  restoreLibraryItems,
} from "./data/restore";

export { reconcileElements } from "./data/reconcile";

export { exportScene, exportToClipboard } from "./scene/export";

export type {
  ExportSceneData,
  ExportSceneConfig,
  ExportSceneOptions,
} from "./scene/export";

export { serializeAsJSON, serializeLibraryAsJSON } from "./data/json";
export {
  loadFromBlob,
  loadSceneOrLibraryFromBlob,
  loadLibraryFromBlob,
} from "./data/blob";
export { mergeLibraryItems, getLibraryItemsHash } from "./data/library";
export { isLinearElement } from "@svelte-draw/element";

export {
  FONT_FAMILY,
  THEME,
  MIME_TYPES,
  ROUNDNESS,
  DEFAULT_LASER_COLOR,
  UserIdleState,
  normalizeLink,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
  getFormFactor,
  throttleRAF,
} from "@svelte-draw/common";

export {
  mutateElement,
  newElementWith,
  bumpVersion,
} from "@svelte-draw/element";

export { CaptureUpdateAction } from "@svelte-draw/element";

export { parseLibraryTokensFromUrl } from "./data/library";
export { useHandleLibrary } from "./data/handleLibrary.svelte";

export { Sidebar } from "./components/Sidebar/Sidebar";
export { default as Button } from "./components/Button.svelte";
export { default as Footer } from "./components/footer/FooterCenter.svelte";
export { default as MainMenu } from "./components/main-menu/MainMenu";
export { default as Ellipsify } from "./components/Ellipsify.svelte";
export { useEditorInterface, useStylesPanelMode } from "./ui/editorContext";
export { useSvelteDrawAPI } from "./ui/apiContext";

export { default as WelcomeScreen } from "./components/welcome-screen/WelcomeScreen";
export { default as LiveCollaborationTrigger } from "./components/live-collaboration/LiveCollaborationTrigger.svelte";
export { Stats, StatsRow, StatsRows } from "./components/Stats";

export { DefaultSidebar } from "./components/DefaultSidebar";
export { default as TTDDialog } from "./components/TTDDialog/TTDDialog.svelte";
export { default as TTDWelcomeMessage } from "./components/TTDDialog/TTDWelcomeMessage.svelte";
export { default as TTDDialogTrigger } from "./components/TTDDialog/TTDDialogTrigger.svelte";
export {
  TTDStreamFetch,
  parseSSEStream,
} from "./components/TTDDialog/utils/TTDStreamFetch";
export type { StreamChunk } from "./components/TTDDialog/utils/TTDStreamFetch";
export type {
  TTDPersistenceAdapter,
  SavedChat,
  SavedChats,
} from "./components/TTDDialog/types";

export type {
  ViewportStatusFrame,
  ElementRenderOverride,
  ElementRenderOverrides,
} from "./types";

export { zoomToFitBounds, DEFAULT_OVERSCROLL } from "./viewport";

export {
  getCommonBounds,
  getVisibleSceneBounds,
  convertToExcalidrawElements,
} from "@svelte-draw/element";

export { elementsOverlappingBBox } from "@svelte-draw/element";

export { default as DiagramToCodePlugin } from "./components/DiagramToCodePlugin/DiagramToCodePlugin.svelte";
export { getDataURL } from "./data/blob";
export { isElementLink } from "@svelte-draw/element";

export { Fonts } from "./fonts/Fonts";

export { setCustomTextMetricsProvider } from "@svelte-draw/element";
export type { RenderEnvironment } from "@svelte-draw/element";

export { CommandPalette } from "./components/CommandPalette/CommandPalette";

export {
  renderSpreadsheet,
  tryParseSpreadsheet,
  isSpreadsheetValidForChartType,
} from "./charts";

// -----------------------------------------------------------------------------
// useSvelteDrawStateValue() wrapper for host apps for the return type to reflect the
// the potentially `undefined` value for initial render before the excalidrawAPI
// is ready.
//
/**
 * hook that subscribes to specific appState prop(s)
 *
 * @param prop - appState prop(s) to subscribe to, or a selector function.
 * NOTE `prop/selector` is memoized and will not change after initial render
 */
export function useSvelteDrawStateValue<K extends keyof AppState>(
  prop: K,
): { readonly current: AppState[K] | undefined };
export function useSvelteDrawStateValue<T extends keyof AppState>(
  props: T[],
): { readonly current: AppState | undefined };
export function useSvelteDrawStateValue<T>(
  selector: (appState: AppState) => T,
): { readonly current: T | undefined };
export function useSvelteDrawStateValue(
  selector:
    | keyof AppState
    | (keyof AppState)[]
    | ((appState: AppState) => unknown),
) {
  return _useAppStateValue(selector as any, false) as { readonly current: unknown };
}
// -----------------------------------------------------------------------------

export { _useOnAppStateChange as useOnSvelteDrawStateChange };

export { applyDarkModeFilter, getStrokeWidthByKey };
