import { addEventListener } from "@svelte-draw/common";

import { isModuleLoadError } from "../utils/mermaidError";

import type { MermaidToExcalidrawLibProps } from "../types";

/**
 * Lazily imports `@excalidraw/mermaid-to-excalidraw`. The module is loaded
 * through a plain dynamic import so that it can be replaced in tests with a
 * regular `vi.mock("@excalidraw/mermaid-to-excalidraw", ...)`.
 */
export const loadMermaidToExcalidrawLib = (
  onChunkLoadError: (api: MermaidToExcalidrawLibProps["api"]) => void,
): MermaidToExcalidrawLibProps["api"] => {
  const api: MermaidToExcalidrawLibProps["api"] = import(
    "@excalidraw/mermaid-to-excalidraw"
  ).then((lib) => ({
    // mermaid lazy-loads a chunk per diagram type, which can fail to load
    // (e.g. offline) even though the lib itself loaded fine
    parseMermaidToExcalidraw: async (definition, config) => {
      try {
        return await lib.parseMermaidToExcalidraw(definition, config);
      } catch (error) {
        if (isModuleLoadError(error)) {
          onChunkLoadError(api);
        }
        throw error;
      }
    },
  }));
  // don't let a discarded promise's rejection go unhandled (consumers
  // awaiting `api` still get the rejection)
  api.catch(() => {});
  return api;
};

/**
 * Tracks the loading state of the mermaid-to-excalidraw lib.
 * Must be called during component initialization (registers effects).
 */
export const useMermaidToExcalidrawLib = (getOwnerWindow: () => Window & typeof globalThis) => {
  // `api` (or one of the chunks it lazy-loads) failed to load
  const setLoadError = (api: MermaidToExcalidrawLibProps["api"]) => {
    const reloadRequired = navigator.onLine;
    if (lib.api !== api) {
      return;
    }
    lib = {
      ...lib,
      status: "error",
      reloadRequired: lib.reloadRequired || reloadRequired,
    };
  };

  let lib = $state.raw<MermaidToExcalidrawLibProps>({
    status: "loading",
    api: loadMermaidToExcalidrawLib((api) => setLoadError(api)),
  });

  const retry = () => {
    if (lib.status === "error") {
      lib = {
        ...lib,
        status: "loading",
        api: loadMermaidToExcalidrawLib(setLoadError),
      };
    }
  };

  const api = $derived(lib.api);
  const status = $derived(lib.status);

  $effect(() => {
    const currentApi = api;
    currentApi.then(
      () => {
        if (lib.api === currentApi) {
          lib = { ...lib, status: "loaded", reloadRequired: false };
        }
      },
      (error: unknown) => {
        console.error("Failed to load mermaid-to-excalidraw", error);
        setLoadError(currentApi);
      },
    );
  });

  // the lib chunk isn't precached, so a failed load is most likely due to
  // being offline -> retry automatically once we're back online
  $effect(() => {
    if (status !== "error") {
      return;
    }
    return addEventListener(getOwnerWindow(), "online", retry);
  });

  return {
    get lib() {
      return lib;
    },
    retry,
  };
};
