import { DEFAULT_GRID_SIZE, KEYS, arrayToMap } from "@svelte-draw/common";

import { getNonDeletedElements } from "@svelte-draw/element";

import { LinearElementEditor } from "@svelte-draw/element";

import { getSelectedElements } from "@svelte-draw/element";

import { syncMovedIndices } from "@svelte-draw/element";

import { duplicateElements } from "@svelte-draw/element";

import { CaptureUpdateAction } from "@svelte-draw/element";

import { DuplicateIcon } from "../components/icons";

import { getSelectionStateForElements } from "../components/App.selection";

import DuplicateSelectionPanel from "./panels/DuplicateSelectionPanel.svelte";

import { register } from "./register";

export const actionDuplicateSelection = register({
  name: "duplicateSelection",
  label: "labels.duplicateSelection",
  icon: DuplicateIcon,
  trackEvent: { category: "element" },
  perform: (elements, appState, formData, app) => {
    if (appState.selectedElementsAreBeingDragged) {
      return false;
    }

    // duplicate selected point(s) if editing a line
    if (appState.selectedLinearElement?.isEditing) {
      // TODO: Invariants should be checked here instead of duplicateSelectedPoints()
      try {
        const newAppState = LinearElementEditor.duplicateSelectedPoints(
          appState,
          app.scene,
        );

        return {
          elements,
          appState: newAppState,
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        };
      } catch {
        return false;
      }
    }

    const duplication = duplicateElements({
      type: "in-place",
      elements,
      idsOfElementsToDuplicate: arrayToMap(
        getSelectedElements(elements, appState, {
          includeBoundTextElement: true,
          includeElementsInFrames: true,
        }),
      ),
      appState,
      randomizeSeed: true,
      overrides: ({ origElement, origIdToDuplicateId }) => {
        const duplicateFrameId =
          origElement.frameId && origIdToDuplicateId.get(origElement.frameId);
        return {
          x: origElement.x + DEFAULT_GRID_SIZE / 2,
          y: origElement.y + DEFAULT_GRID_SIZE / 2,
          frameId: duplicateFrameId ?? origElement.frameId,
        };
      },
    });

    let { duplicatedElements, elementsWithDuplicates } = duplication;

    if (app.props.onDuplicate) {
      ({ elements: elementsWithDuplicates, duplicatedElements } =
        app.duplicate.runOnDuplicate(
          duplication,
          elementsWithDuplicates,
          elements,
        ));

      // host vetoed the duplication
      if (!duplicatedElements.length) {
        return false;
      }
    }

    app.duplicate.advanceListMarkers(duplicatedElements);

    return {
      elements: syncMovedIndices(
        elementsWithDuplicates,
        arrayToMap(duplicatedElements),
      ),
      appState: {
        ...appState,
        ...getSelectionStateForElements(
          duplicatedElements,
          getNonDeletedElements(elementsWithDuplicates),
          appState,
        ),
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.D,
  PanelComponent: DuplicateSelectionPanel,
});
