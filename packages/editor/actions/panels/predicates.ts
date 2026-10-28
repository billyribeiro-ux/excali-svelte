import {
  frameAndChildrenSelectedTogether,
  getSelectedElementsByGroup,
  isElementInGroup,
  isFrameLikeElement,
} from "@svelte-draw/element";

import type { ExcalidrawElement } from "@svelte-draw/element/types";

import type { AppClassProperties, AppState, UIAppState } from "../../types";

// predicates shared between the action modules and their Svelte panels
// (kept here so that actions and panels do not import each other)

export const alignActionsPredicate = (
  appState: UIAppState,
  app: AppClassProperties,
) => {
  const selectedElements = app.scene.getSelectedElements(appState);
  return (
    getSelectedElementsByGroup(
      selectedElements,
      app.scene.getNonDeletedElementsMap(),
      appState as Readonly<AppState>,
    ).length > 1 &&
    // TODO enable aligning frames when implemented properly
    !selectedElements.some((el) => isFrameLikeElement(el))
  );
};

export const enableActionDistribute = (
  appState: UIAppState,
  app: AppClassProperties,
) => {
  const selectedElements = app.scene.getSelectedElements(appState);
  return (
    getSelectedElementsByGroup(
      selectedElements,
      app.scene.getNonDeletedElementsMap(),
      appState,
    ).length > 2 &&
    // TODO enable distributing frames when implemented properly
    !selectedElements.some((el) => isFrameLikeElement(el))
  );
};

const allElementsInSameGroup = (
  elements: readonly ExcalidrawElement[],
  editingGroupId: UIAppState["editingGroupId"],
) => {
  if (elements.length >= 2) {
    const editingGroupIndex = editingGroupId
      ? elements[0].groupIds.indexOf(editingGroupId)
      : -1;
    const groupIds =
      editingGroupIndex > -1
        ? elements[0].groupIds.slice(0, editingGroupIndex)
        : elements[0].groupIds;
    for (const groupId of groupIds) {
      if (elements.every((element) => isElementInGroup(element, groupId))) {
        return true;
      }
    }
  }
  return false;
};

export const enableActionGroup = (
  appState: UIAppState,
  app: AppClassProperties,
) => {
  const selectedElements = app.scene.getSelectedElements({
    selectedElementIds: appState.selectedElementIds,
    includeBoundTextElement: false,
  });

  return (
    selectedElements.length >= 2 &&
    !allElementsInSameGroup(selectedElements, appState.editingGroupId) &&
    !frameAndChildrenSelectedTogether(selectedElements)
  );
};
