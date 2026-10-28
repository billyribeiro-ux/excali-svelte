import { vi } from "vitest";

import { getDefaultAppState } from "../../appState";

import type { EditorInterface } from "@svelte-draw/common";

import type { EditorContextValue } from "../../ui/editorContext";
import type { AppState } from "../../types";

/**
 * Minimal, reactive stand-in for the editor context used by the menu/sidebar
 * tests. `appState` is reactive (`setAppState` merges like the editor does), so
 * components re-render as they would in the real editor. Only what the tested
 * components read is provided.
 */
export const createFakeEditor = (
  overrides: {
    appState?: Partial<AppState>;
    editorInterface?: Partial<EditorInterface>;
    props?: Record<string, unknown>;
    app?: Record<string, unknown>;
    actionManager?: Record<string, unknown>;
  } = {},
) => {
  let appState = $state.raw<AppState>({
    ...getDefaultAppState(),
    width: 1920,
    height: 1080,
    ...overrides.appState,
  } as AppState);

  const setAppState = vi.fn((update: any) => {
    const partial = typeof update === "function" ? update(appState) : update;
    appState = { ...appState, ...partial };
  });

  const executeAction = vi.fn();

  // same semantics as `App.toggleSidebar`
  const toggleSidebar = ({
    name,
    tab,
    force,
  }: {
    name: string | null;
    tab?: string;
    force?: boolean;
  }): boolean => {
    let nextName: string | null;
    if (force === undefined) {
      nextName =
        appState.openSidebar?.name === name && appState.openSidebar?.tab === tab
          ? null
          : name;
    } else {
      nextName = force ? name : null;
    }

    const nextState: AppState["openSidebar"] = nextName
      ? { name: nextName }
      : null;
    if (nextState && tab) {
      nextState.tab = tab;
    }

    appState = { ...appState, openSidebar: nextState };

    return !!nextName;
  };

  const editorInterface: EditorInterface = {
    formFactor: "desktop",
    desktopUIMode: "full",
    userAgent: { isMobileDevice: false, platform: "other" },
    isTouchScreen: false,
    canFitSidebar: true,
    isLandscape: true,
    ...overrides.editorInterface,
  };

  const ctx = {
    app: {
      id: "test-editor",
      toggleLock: vi.fn(),
      toggleSidebar,
      isNavigationEnabled: () => true,
      ownerDocument: document,
      ownerWindow: window,
      ...overrides.app,
    },
    props: {
      UIOptions: { canvasActions: { changeViewBackgroundColor: true } },
      ...overrides.props,
    },
    get appState() {
      return appState;
    },
    elements: [],
    actionManager: {
      isActionEnabled: () => true,
      executeAction,
      getPanel: () => null,
      getElementsIncludingDeleted: () => [],
      ...overrides.actionManager,
    },
    editorInterface,
    api: null,
    container: document.createElement("div"),
    setAppState,
  } as unknown as EditorContextValue;

  return {
    ctx,
    setAppState,
    executeAction,
    toggleSidebar,
    getAppState: () => appState,
  };
};
