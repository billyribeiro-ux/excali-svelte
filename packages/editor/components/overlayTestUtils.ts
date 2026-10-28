import { render } from "@testing-library/svelte";

import { newElement, newLinearElement } from "@svelte-draw/element";

import { getDefaultAppState } from "../appState";
import { createSignal } from "../ui/signal";
import { setEditorContext, type EditorContextValue } from "../ui/editorContext";

import type { Component } from "svelte";

import type { AppState } from "../types";

/**
 * Minimal editor context for rendering editor-bound components in isolation.
 * `appState` is reactive: call `ctx.update({...})` to commit a change.
 */
export const createFakeEditorContext = (
  overrides: Partial<
    Omit<EditorContextValue, "appState" | "elements">
  > & {
    appState?: Partial<AppState>;
    elements?: EditorContextValue["elements"];
  } = {},
) => {
  const { appState: appStateOverrides, elements, ...rest } = overrides;
  const state = createSignal<AppState>({
    ...getDefaultAppState(),
    width: 1000,
    height: 800,
    offsetLeft: 0,
    offsetTop: 0,
    ...appStateOverrides,
  } as AppState);
  const elementsSignal = createSignal(elements ?? []);

  const ctx = {
    app: {} as EditorContextValue["app"],
    props: {} as EditorContextValue["props"],
    actionManager: {} as EditorContextValue["actionManager"],
    editorInterface: { formFactor: "desktop" } as any,
    api: null,
    container: null,
    setAppState: ((update: any) => {
      const next = typeof update === "function" ? update(state.peek()) : update;
      if (next) {
        state.set({ ...state.peek(), ...next });
      }
    }) as EditorContextValue["setAppState"],
    ...rest,
    get appState() {
      return state.get();
    },
    get elements() {
      return elementsSignal.get();
    },
  } as EditorContextValue;

  return {
    ctx,
    update: (next: Partial<AppState>) =>
      state.set({ ...state.peek(), ...next }),
    setElements: (next: EditorContextValue["elements"]) =>
      elementsSignal.set(next),
  };
};

/** renders `component` with the editor context provided */
export const renderWithEditorContext = <P extends Record<string, any>>(
  component: Component<P>,
  props: P,
  ctx: EditorContextValue,
) => {
  const Wrapper = ((...args: [any, any]) => {
    setEditorContext(ctx);
    return (component as any)(...args);
  }) as unknown as Component<P>;
  return render(Wrapper, props);
};

/** `newElement` with the positional defaults tests don't care about */
export const makeElement = (props: Record<string, any>) =>
  newElement({ x: 0, y: 0, ...props } as any);

export const makeLinear = (props: Record<string, any>) =>
  newLinearElement({ x: 0, y: 0, ...props } as any);
