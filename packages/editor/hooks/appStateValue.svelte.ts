import { getDefaultAppState } from "../appState";
import { useSvelteDrawAPI } from "../ui/apiContext";
import { getEditorContext, hasEditorContext } from "../ui/editorContext";

import type { AppState, SvelteDrawAPI } from "../types";

type AppStateSelector =
  | keyof AppState
  | (keyof AppState)[]
  | ((appState: AppState) => unknown);

const getSelectedValue = (appState: AppState, selector: AppStateSelector) => {
  if (typeof selector === "function") {
    return selector(appState);
  }
  if (Array.isArray(selector)) {
    return appState;
  }
  return appState[selector];
};

const getLatestValue = (
  api: SvelteDrawAPI | null,
  selector: AppStateSelector,
  _internal: boolean,
) => {
  if (api?.isDestroyed) {
    return;
  }

  let appState = api?.getAppState();
  if (!appState) {
    if (!_internal) {
      return undefined;
    }

    console.warn(
      "useAppStateValue: excalidrawAPI not defined yet for internal component while it should always be defined. Are you sure you're rendering inside of <SvelteDraw/> component tree?",
    );
    // fall back in case there's a bug so we don't break the app
    // (internal components using this internal useAppStateValue expect
    //  non-undefined values on init)
    appState = Object.assign(
      { width: 0, height: 0, offsetLeft: 0, offsetTop: 0 },
      getDefaultAppState(),
    );
  }

  return getSelectedValue(appState, selector);
};

/**
 * The imperative API of the surrounding editor: the editor's own context when
 * rendered inside <SvelteDraw>, otherwise the one published to an
 * `<SvelteDrawAPIProvider>`.
 */
const useResolvedAPI = () => {
  const editorContext = hasEditorContext() ? getEditorContext() : null;
  const providedAPI = useSvelteDrawAPI();
  return () => editorContext?.api ?? providedAPI.current;
};

/**
 * Subscribes to specific appState changes. Re-evaluates dependents only when
 * the specified prop(s) change — not on every appState update.
 *
 * Works both inside and outside the <SvelteDraw> tree, as long as
 * an `<SvelteDrawAPIProvider>` is an ancestor (automatically provided inside
 * <SvelteDraw>, or manually by the host app). Read `.current`.
 *
 * Returns the narrowed value depending on prop form:
 *  - `keyof AppState` → `AppState[K]`
 *  - `(keyof AppState)[]` → whole `AppState`
 *  - selector function → selector's return type `T`
 *
 * If excalidrawAPI is not ready yet (host apps), `.current` is `undefined`
 * and updates with the latest value once available.
 */
export function useAppStateValue<K extends keyof AppState>(
  prop: K,
  _internal?: boolean,
): { readonly current: AppState[K] };
export function useAppStateValue(
  props: (keyof AppState)[],
  _internal?: boolean,
): { readonly current: AppState };
export function useAppStateValue<T>(
  selector: (appState: AppState) => T,
  _internal?: boolean,
): { readonly current: T };
export function useAppStateValue(
  selector: AppStateSelector,
  _internal: boolean = true,
): { readonly current: unknown } {
  const getAPI = useResolvedAPI();

  let latestValue = $state.raw<unknown>(
    getLatestValue(getAPI(), selector, _internal),
  );

  $effect(() => {
    const api = getAPI();
    if (!api || api.isDestroyed) {
      return;
    }

    latestValue = getLatestValue(api, selector, _internal);

    return api.onStateChange(selector, (newValue: unknown) => {
      latestValue = newValue;
    });
  });

  return {
    get current() {
      return latestValue;
    },
  };
}

/**
 * Subscribes to specific appState changes without re-evaluating anything.
 *
 * The callback is called on every matching change, but also once the editor
 * is available so you can initialize your state.
 */
export function useOnAppStateChange<K extends keyof AppState>(
  prop: K,
  callback: (value: AppState[K], appState: AppState) => void,
): void;
export function useOnAppStateChange(
  props: (keyof AppState)[],
  callback: (props: AppState, appState: AppState) => void,
): void;
export function useOnAppStateChange<T>(
  selector: (appState: AppState) => T,
  callback: (value: T, appState: AppState) => void,
): void;
export function useOnAppStateChange(
  selector: AppStateSelector,
  callback: (value: any, appState: AppState) => void,
): void {
  const getAPI = useResolvedAPI();

  $effect(() => {
    const api = getAPI();
    if (!api || api.isDestroyed) {
      return;
    }

    callback(getLatestValue(api, selector, true), api.getAppState());

    return api.onStateChange(selector, (newValue: any, state: AppState) => {
      callback(newValue, state);
    });
  });
}
