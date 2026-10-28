import {
  arrayToMap,
  deriveStylesPanelMode,
  reduceToCommonValue,
} from "@svelte-draw/common";

import {
  getNonDeletedElements,
  isNonDeletedElement,
  isStickyNoteElement,
  normalizeStickyNote,
} from "@svelte-draw/element";

import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@svelte-draw/element/types";

import { getSelectedElements, isSomeElementSelected } from "../../scene";

import type { AppClassProperties, AppState, Primitive } from "../../types";



export const getStylesPanelInfo = (app: AppClassProperties) => {
  const stylesPanelMode = deriveStylesPanelMode(app.editorInterface);
  return {
    stylesPanelMode,
    isCompact: stylesPanelMode !== "full",
    isMobile: stylesPanelMode === "mobile",
  } as const;
};

export const changeProperty = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  callback: (element: NonDeletedExcalidrawElement) => ExcalidrawElement,
  includeBoundText = false,
) => {
  const selectedElementIds = arrayToMap(
    getSelectedElements(elements, appState, {
      includeBoundTextElement: includeBoundText,
    }),
  );

  return elements.map((element) => {
    if (
      selectedElementIds.get(element.id) ||
      element.id === appState.editingTextElement?.id
    ) {
      // selected & editing elements are non-deleted
      if (!isNonDeletedElement(element)) {
        // SAFETY: This should never happen, but log it just in case
        console.error(
          "[NONDELETED][INVARIANT] changeProperty(): skipping deleted selected/editing element",
        );
      }
      const nextElement = callback(element as NonDeletedExcalidrawElement);
      // sticky notes keep their data invariants (never-transparent colors,
      // solid fill, minimum size) whatever property was written; a no-op
      // normalization returns the same object
      return isStickyNoteElement(nextElement)
        ? normalizeStickyNote(nextElement)
        : nextElement;
    }
    return element;
  });
};

export const getFormValue = function <T extends Primitive>(
  elements: readonly ExcalidrawElement[],
  app: AppClassProperties,
  /**
   * input value (usually the element attribute value,
   * but depends on what the action's PanelComponent input expects)
   */
  getValue: (element: ExcalidrawElement) => T,
  elementPredicate: true | ((element: ExcalidrawElement) => boolean),
  defaultValue: T | ((isSomeElementSelected: boolean) => T),
): T {
  const editingTextElement = app.state.editingTextElement;
  const nonDeletedElements = getNonDeletedElements(elements);

  let ret: T | null = null;

  if (editingTextElement) {
    ret = getValue(editingTextElement);
  }

  if (!ret) {
    const hasSelection = isSomeElementSelected(nonDeletedElements, app.state);

    if (hasSelection) {
      const selectedElements = app.scene.getSelectedElements(app.state);
      const targetElements =
        elementPredicate === true
          ? selectedElements
          : selectedElements.filter((el) => elementPredicate(el));

      ret =
        reduceToCommonValue(targetElements, getValue) ??
        (typeof defaultValue === "function"
          ? defaultValue(true)
          : defaultValue);
    } else {
      ret =
        typeof defaultValue === "function" ? defaultValue(false) : defaultValue;
    }
  }

  return ret;
};
