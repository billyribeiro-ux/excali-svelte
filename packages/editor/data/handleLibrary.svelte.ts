import { untrack } from "svelte";

import {
  attachLibraryApiHandlers,
  attachLibraryPersistence,
  type HandleLibraryOpts,
} from "./library";

/**
 * Hooks the editor up to the library (URL installs, initial load, persistence).
 * Call it from a component's `<script>`; pass a getter so the latest options
 * (e.g. a changed `adapter`) are used without re-running the setup:
 *
 * ```ts
 * useHandleLibrary(() => ({ excalidrawAPI: api, adapter }));
 * ```
 */
export const useHandleLibrary = (getOpts: () => HandleLibraryOpts) => {
  const isLibraryLoadedRef = { current: false };

  // Runs on editor remounts only (when `excalidrawAPI` changes)
  $effect(() => {
    const excalidrawAPI = getOpts().excalidrawAPI;
    if (!excalidrawAPI) {
      return;
    }

    // reset on editor remount (excalidrawAPI changed)
    isLibraryLoadedRef.current = false;

    return untrack(() =>
      attachLibraryApiHandlers(getOpts, excalidrawAPI, isLibraryLoadedRef),
    );
  });

  // Not tied to an editor instance: the update queue/loop survives remounts.
  $effect(() =>
    untrack(() => attachLibraryPersistence(getOpts, isLibraryLoadedRef)),
  );
};
