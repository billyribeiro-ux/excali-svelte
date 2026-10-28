import { createContext } from "svelte";

import type { SvelteDrawAPI } from "../types";

/**
 * Lets `useSvelteDrawAPI()` (and helpers built on it) work outside the
 * <SvelteDraw> component tree: a host wraps both in `<SvelteDrawAPIProvider>`.
 * <SvelteDraw> publishes its imperative API through `set`.
 */
export type SvelteDrawAPIContextValue = {
  readonly api: SvelteDrawAPI | null;
  set(api: SvelteDrawAPI | null): void;
};

export const [
  getExcalidrawAPIContext,
  setExcalidrawAPIContext,
  hasExcalidrawAPIContext,
] = createContext<SvelteDrawAPIContextValue>();

/**
 * Replaces the React `useSvelteDrawAPI()` hook. Read `.current`; it is `null`
 * until the editor has mounted (and outside of an `SvelteDrawAPIProvider`).
 */
export const useSvelteDrawAPI = () => {
  const context = hasExcalidrawAPIContext() ? getExcalidrawAPIContext() : null;
  return {
    get current(): SvelteDrawAPI | null {
      return context?.api ?? null;
    },
  };
};
