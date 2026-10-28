import type { MaybePromise } from "@svelte-draw/common/utility-types";

import type { ExcalidrawElement } from "@svelte-draw/element/types";

import { getFileHandleType, isImageFileHandleType } from "./blob";

 
import { exportCanvas, prepareElementsForExport } from ".";

import type { AppState, BinaryFiles } from "../types";

export const resaveAsImageWithScene = async (
  data: MaybePromise<{
    elements: readonly ExcalidrawElement[];
    appState: AppState;
    files: BinaryFiles;
  }>,
  fileHandle: FileSystemFileHandle,
  filename: string,
) => {
  const fileHandleType = getFileHandleType(fileHandle);

  if (!isImageFileHandleType(fileHandleType)) {
    throw new Error(
      "fileHandle should exist and should be of type svg or png when resaving",
    );
  }

  const { elements, appState: dataAppState, files } = await data;

  const appState = {
    ...dataAppState,
    exportEmbedScene: true,
  };

  const { exportedElements, exportingFrame } = prepareElementsForExport(
    elements,
    appState,
    false,
  );

  await exportCanvas(fileHandleType, exportedElements, appState, files, {
    name: filename,
    fileHandle,
    exportingFrame,
  });

  return { fileHandle };
};
