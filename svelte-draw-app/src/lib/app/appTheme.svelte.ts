import { MediaQuery } from "svelte/reactivity";

import { THEME } from "@svelte-draw/editor";

import type { Theme } from "@svelte-draw/element/types";

import { STORAGE_KEYS } from "./app_constants.ts";

/**
 * Replaces the React `useHandleAppTheme()` hook (`useHandleAppTheme.ts`).
 *
 * Must be called during component initialization (it registers effects).
 * `appTheme` is the user's choice (`"light" | "dark" | "system"`, persisted to
 * localStorage), `editorTheme` the resolved theme to pass to `<SvelteDraw>`.
 */
export const useHandleAppTheme = () => {
  let appTheme = $state<Theme | "system">(
    (localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME) as
      | Theme
      | "system"
      | null) || THEME.LIGHT,
  );

  // `window.matchMedia` is absent in some environments (e.g. jsdom)
  const prefersDark =
    typeof window.matchMedia === "function"
      ? new MediaQuery("prefers-color-scheme: dark")
      : null;

  const editorTheme = $derived<Theme>(
    appTheme === "system"
      ? prefersDark?.current
        ? THEME.DARK
        : THEME.LIGHT
      : appTheme,
  );

  // (was a layout effect)
  $effect.pre(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, appTheme);
  });

  return {
    get editorTheme() {
      return editorTheme;
    },
    get appTheme() {
      return appTheme;
    },
    setAppTheme(theme: Theme | "system") {
      appTheme = theme;
    },
  };
};
