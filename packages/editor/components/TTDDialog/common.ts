import { DEFAULT_EXPORT_PADDING, EDITOR_LS_KEYS } from "@svelte-draw/common";

import { convertToExcalidrawElements } from "@svelte-draw/element";

import { exportScene } from "@svelte-draw/utils";

import type {
  Theme,
} from "@svelte-draw/element/types";

import { EditorLocalStorage } from "../../data/EditorLocalStorage";

import type { MermaidData, MermaidToExcalidrawLibProps } from "./types";

import type { AppClassProperties, } from "../../types";

export const resetPreview = ({
  canvasRef,
  setError,
}: {
  canvasRef: { current: HTMLDivElement | null };
  setError: (error: Error | null) => void;
}) => {
  const canvasNode = canvasRef.current;

  if (!canvasNode) {
    return;
  }
  const parent = canvasNode.parentElement;
  if (!parent) {
    return;
  }
  parent.style.background = "";
  setError(null);
  canvasNode.replaceChildren();
};

export const convertMermaidToExcalidraw = async ({
  canvasRef,
  mermaidToExcalidrawLib,
  mermaidDefinition,
  setError,
  data,
  theme,
}: {
  canvasRef: { current: HTMLDivElement | null };
  mermaidToExcalidrawLib: MermaidToExcalidrawLibProps;
  mermaidDefinition: string;
  setError: (error: Error | null) => void;
  data: { current: MermaidData };
  theme: Theme;
}): Promise<{ success: true } | { success: false; error?: Error }> => {
  const canvasNode = canvasRef.current;
  const parent = canvasNode?.parentElement;

  if (!canvasNode || !parent) {
    return { success: false };
  }

  if (!mermaidDefinition) {
    resetPreview({ canvasRef, setError });
    return { success: false };
  }

  let ret;
  try {
    const api = await mermaidToExcalidrawLib.api;

    try {
      ret = await api.parseMermaidToExcalidraw(mermaidDefinition);
    } catch (err: unknown) {
      const originalParseError = err as Error;

      if (!mermaidDefinition.includes('"')) {
        return { success: false, error: originalParseError };
      }

      try {
        ret = await api.parseMermaidToExcalidraw(
          mermaidDefinition.replace(/"/g, "'"),
        );
      } catch {
        // Keep the original error so line/column references stay aligned with
        // the user's unmodified input.
        return { success: false, error: originalParseError };
      }
    }

    const { elements, files = {} } = ret;
    setError(null);

    data.current = {
      elements: convertToExcalidrawElements(elements, {
        regenerateIds: true,
      }),
      files,
    };

    const canvas = await exportScene({
      type: "canvas",
      data: {
        elements: data.current.elements,
        files: data.current.files,
      },
      config: {
        padding: DEFAULT_EXPORT_PADDING,
        maxWidthOrHeight:
          Math.max(parent.offsetWidth, parent.offsetHeight) *
          (parent.ownerDocument.defaultView?.devicePixelRatio ?? 1),
        theme,
      },
    });

    parent.style.background = "var(--default-bg-color)";
    canvasNode.replaceChildren(canvas);
    return { success: true };
  } catch (err: any) {
    parent.style.background = "var(--default-bg-color)";
    if (mermaidDefinition) {
      setError(err);
    }

    // Return error so caller can display meaningful error message
    return { success: false, error: err };
  }
};
export const saveMermaidDataToStorage = (mermaidDefinition: string) => {
  EditorLocalStorage.set(
    EDITOR_LS_KEYS.MERMAID_TO_EXCALIDRAW,
    mermaidDefinition,
  );
};

export const insertToEditor = ({
  app,
  data,
  text,
  shouldSaveMermaidDataToStorage,
}: {
  app: AppClassProperties;
  data: { current: MermaidData };
  text?: string;
  shouldSaveMermaidDataToStorage?: boolean;
}) => {
  const { elements: newElements, files } = data.current;

  if (!newElements.length) {
    return;
  }

  app.addElementsFromPasteOrLibrary({
    elements: newElements,
    files,
    position: "center",
    fit: "scale-down",
  });
  app.setOpenDialog(null);

  if (shouldSaveMermaidDataToStorage && text) {
    saveMermaidDataToStorage(text);
  }
};
