import { createContext } from "svelte";

import { type StylesPanelMode } from "@svelte-draw/common";

import { createSignal, type Signal } from "./signal";

import type { ActionManager } from "../actions/manager";
import type { EditorInterface } from "@svelte-draw/common";

import type {
  AppClassProperties,
  AppProps,
  AppState,
  SvelteDrawAPI,
} from "../types";
import type { Editor } from "../editor/Editor";
import type { OrderedExcalidrawElement } from "@svelte-draw/element/types";

/**
 * Everything Svelte components need from the editor core. Replaces the React
 * contexts of `components/App` (`useApp`, `useAppProps`, `useEditorInterface`,
 * `useExcalidrawContainer`, `useExcalidrawElements`, `useExcalidrawAppState`,
 * `useExcalidrawSetAppState`, `useExcalidrawActionManager`,
 * `useSvelteDrawAPI`).
 *
 * `appState` / `elements` are reactive getters: reading them inside a template
 * or `$derived` re-evaluates when the editor commits an update.
 */
export type EditorContextValue = {
  readonly app: AppClassProperties;
  readonly props: AppProps;
  readonly appState: AppState;
  readonly elements: readonly OrderedExcalidrawElement[];
  readonly actionManager: ActionManager;
  readonly editorInterface: EditorInterface;
  /** replaces `useStylesPanelMode()`; derived from `editorInterface` */
  readonly stylesPanelMode: StylesPanelMode;
  readonly api: SvelteDrawAPI | null;
  readonly container: HTMLDivElement | null;
  setAppState: AppClassProperties["setAppState"];
};

export const [getEditorContext, setEditorContext, hasEditorContext] =
  createContext<EditorContextValue>();

/** replaces `useEditorInterface()`; read `.current` */
export const useEditorInterface = () => {
  const ctx = getEditorContext();
  return {
    get current(): EditorInterface {
      return ctx.editorInterface;
    },
  };
};

/** replaces `useStylesPanelMode()`; read `.current` */
export const useStylesPanelMode = () => {
  const ctx = getEditorContext();
  return {
    get current(): StylesPanelMode {
      return ctx.stylesPanelMode;
    },
  };
};

type BridgedEditor = Editor<AppProps, AppState> & {
  scene: { getNonDeletedElements(): readonly any[] };
  editorInterface: EditorInterface;
  api: SvelteDrawAPI | null;
  excalidrawContainerRef: { current: HTMLDivElement | null };
};

/**
 * Mirrors a mounted editor's state into signals. The editor's commit listener
 * runs where React would have committed the DOM, so Svelte sees a consistent
 * state.
 */
export const createEditorBridge = (editor: BridgedEditor) => {
  const state: Signal<AppState> = createSignal(editor.state as AppState);
  const props: Signal<AppProps> = createSignal(editor.props as AppProps);
  const elements: Signal<readonly OrderedExcalidrawElement[]> = createSignal(
    editor.scene.getNonDeletedElements() as readonly OrderedExcalidrawElement[],
  );

  const editorInterface = createSignal(editor.editorInterface);
  const api = createSignal<SvelteDrawAPI | null>(editor.api);
  const container = createSignal<HTMLDivElement | null>(
    editor.excalidrawContainerRef.current,
  );

  const sync = () => {
    editorInterface.set(editor.editorInterface);
    api.set(editor.api);
    container.set(editor.excalidrawContainerRef.current);
    state.set(editor.state as AppState);
    props.set(editor.props as AppProps);
    elements.set(
      editor.scene.getNonDeletedElements() as readonly OrderedExcalidrawElement[],
    );
  };

  return {
    state,
    props,
    elements,
    editorInterface,
    api,
    container,
    sync,
    subscribe: () => editor.subscribeCommit(sync),
  };
};
