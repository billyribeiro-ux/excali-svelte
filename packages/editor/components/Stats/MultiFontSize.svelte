<script module lang="ts">
  import {
    getBoundTextElement,
    getBaseFontSize,
    getBaseFontSizeUpdate,
    redrawTextBoundingBox,
  } from "@svelte-draw/element";
  import { hasBoundTextElement, isTextElement } from "@svelte-draw/element";

  import { isInGroup } from "@svelte-draw/element";

  import type {
    ExcalidrawElement,
    ExcalidrawTextElement,
    NonDeletedSceneElementsMap,
  } from "@svelte-draw/element/types";

  import type { Scene } from "@svelte-draw/element";

  import { fontSizeIcon } from "../icons";

  import DragInput from "./DragInput.svelte";
  import { trackSceneNonce } from "./sceneNonce";
  import { getStepSizedValue } from "./utils";

  import type { DragInputCallbackType } from "./DragInput";
  import type { AppState } from "../../types";

  interface MultiFontSizeProps {
    elements: readonly ExcalidrawElement[];
    scene: Scene;
    elementsMap: NonDeletedSceneElementsMap;
    appState: AppState;
    property: "fontSize";
  }

  const MIN_FONT_SIZE = 4;
  const STEP_SIZE = 4;

  const getApplicableTextElements = (
    elements: readonly (ExcalidrawElement | undefined)[],
    elementsMap: NonDeletedSceneElementsMap,
  ) =>
    elements.reduce(
      (acc: ExcalidrawTextElement[], el) => {
        if (!el || isInGroup(el)) {
          return acc;
        }
        if (isTextElement(el)) {
          acc.push(el);
          return acc;
        }
        if (hasBoundTextElement(el)) {
          const boundTextElement = getBoundTextElement(el, elementsMap);
          if (boundTextElement) {
            acc.push(boundTextElement);
            return acc;
          }
        }

        return acc;
      },

      [],
    );

  const handleFontSizeChange: DragInputCallbackType<
    MultiFontSizeProps["property"],
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
    const latestTextElements = originalElements.map((el) =>
      elementsMap.get(el.id),
    ) as ExcalidrawTextElement[];

    let nextFontSize;

    if (nextValue) {
      nextFontSize = Math.max(Math.round(nextValue), MIN_FONT_SIZE);

      for (const textElement of latestTextElements) {
        scene.mutateElement(
          textElement,
          getBaseFontSizeUpdate(textElement, nextFontSize, elementsMap),
        );

        redrawTextBoundingBox(
          textElement,
          scene.getContainerElement(textElement),
          scene,
          app.renderEnvironment,
        );
      }

      scene.triggerUpdate();
    } else {
      const originalTextElements = originalElements as ExcalidrawTextElement[];

      for (let i = 0; i < latestTextElements.length; i++) {
        const latestElement = latestTextElements[i];
        const originalElement = originalTextElements[i];

        const originalFontSize = Math.round(
          getBaseFontSize(originalElement, elementsMap),
        );
        const changeInFontSize = Math.round(accumulatedChange);
        let nextFontSize = Math.max(
          originalFontSize + changeInFontSize,
          MIN_FONT_SIZE,
        );
        if (shouldChangeByStepSize) {
          nextFontSize = getStepSizedValue(nextFontSize, STEP_SIZE);
        }
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

      scene.triggerUpdate();
    }
  };
</script>

<script lang="ts">

  let {
    elements,
    scene,
    appState,
    property,
    elementsMap,
  }: MultiFontSizeProps = $props();

  const nonce = trackSceneNonce(() => scene);
  const latestTextElements = $derived.by(() => {
    nonce();
    return getApplicableTextElements(elements, elementsMap);
  });
  const value = $derived.by(() => {
    nonce();
    const fontSizes = latestTextElements.map(
      (textEl) => Math.round(getBaseFontSize(textEl, elementsMap) * 10) / 10,
    );
    return new Set(fontSizes).size === 1 ? fontSizes[0] : "Mixed";
  });
  const editable = $derived(latestTextElements.length > 0);
</script>

{#if latestTextElements.length}
  <DragInput
    label="F"
    icon={fontSizeIcon}
    elements={latestTextElements}
    dragInputCallback={handleFontSizeChange}
    {value}
    {editable}
    {scene}
    {property}
    {appState}
  />
{/if}
