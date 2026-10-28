import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";

import { STORAGE_KEYS } from "#lib/app/app_constants.ts";
import { useHandleAppTheme } from "#lib/app/appTheme.svelte.ts";

describe("useHandleAppTheme", () => {
  it("persists the chosen theme and resolves the editor theme", () => {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_STORAGE_THEME);

    const cleanup = $effect.root(() => {
      const theme = useHandleAppTheme();
      flushSync();
      expect(theme.appTheme).toBe("light");
      expect(theme.editorTheme).toBe("light");
      expect(localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME)).toBe(
        "light",
      );

      theme.setAppTheme("dark");
      flushSync();
      expect(theme.editorTheme).toBe("dark");
      expect(localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_THEME)).toBe(
        "dark",
      );

      // jsdom has no `matchMedia` -> "system" resolves to light
      theme.setAppTheme("system");
      flushSync();
      expect(theme.appTheme).toBe("system");
      expect(theme.editorTheme).toBe("light");
    });

    cleanup();
  });
});
