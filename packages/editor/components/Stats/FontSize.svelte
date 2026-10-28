<script module lang="ts">
  import {
    getBoundTextElement,
    getBaseFontSize,
    getBaseFontSizeUpdate,
    redrawTextBoundingBox,
  } from "@svelte-draw/element";
  import { hasBoundTextElement, isTextElement } from "@svelte-draw/element";

  import type {
    ExcalidrawElement,
    ExcalidrawTextElement,
  } from "@svelte-draw/element/types";

  import type { Scene } from "@svelte-draw/element";

  import { fontSizeIcon } from "../icons";

  import DragInput from "./DragInput.svelte";
  import { trackSceneNonce } from "./sceneNonce";
  import { getStepSizedValue } from "./utils";

  import type { DragInputCallbackType } from "./DragInput";
  import type { AppState } from "../../types";

  interface FontSizeProps {
    element: ExcalidrawElement;
    scene: Scene;
    appState: AppState;
    property: "fontSize";
  }

  const MIN_FONT_SIZE = 4;
  const STEP_SIZE = 4;

  const handleFontSizeChange: DragInputCallbackType<
    FontSizeProps["property"],
    ExcalidrawTextElement
  > = ({
    accumulatedChange,
    originalElements,
    shouldChangeByStepSize,
    nextValue,
    scene,
    app,
  }) => {
    const elementsMap = scene.getNonDeletedElementsMap();

    const origElement = originalElements[0];
    if (origElement) {
      const latestElement = elementsMap.get(origElement.id);
      if (!latestElement || !isTextElement(latestElement)) {
        return;
      }

      let nextFontSize;

      if (nextValue !== undefined) {
        nextFontSize = Math.max(Math.round(nextValue), MIN_FONT_SIZE);
      } else if (origElement.type === "text") {
        const originalFontSize = Math.round(
          getBaseFontSize(origElement, elementsMap),
        );
        const changeInFontSize = Math.round(accumulatedChange);
        nextFontSize = Math.max(
          originalFontSize + changeInFontSize,
          MIN_FONT_SIZE,
        );
        if (shouldChangeByStepSize) {
          nextFontSize = getStepSizedValue(nextFontSize, STEP_SIZE);
        }
      }

      if (nextFontSize) {
        scene.mutateElement(
          latestElement,
          getBaseFontSizeUpdate(latestElement, nextFontSize, elementsMap),
        );
        redrawTextBoundingBox(
          latestElement,
          scene.getContainerElement(latestElement),
          scene,
          app.renderEnvironment,
        );
      }
    }
  };
</script>

<script lang="ts">

  let { element, scene, appState, property }: FontSizeProps = $props();

  const nonce = trackSceneNonce(() => scene);
  const textElement = $derived.by(() => {
    nonce();
    return isTextElement(element)
      ? element
      : hasBoundTextElement(element)
      ? getBoundTextElement(element, scene.getNonDeletedElementsMap())
      : null;
  });
  const value = $derived.by(() => {
    nonce();
    return textElement
      ? Math.round(
          getBaseFontSize(textElement, scene.getNonDeletedElementsMap()) * 10,
        ) / 10
      : 0;
  });
</script>

{#if textElement}
  <DragInput
    label="F"
    {value}
    elements={[textElement]}
    dragInputCallback={handleFontSizeChange}
    icon={fontSizeIcon}
    {appState}
    {scene}
    {property}
  />
{/if}
