<script module lang="ts">
  import { degreesToRadians, radiansToDegrees } from "@svelte-draw/math";

  import { getBoundTextElement } from "@svelte-draw/element";
  import { isArrowElement } from "@svelte-draw/element";

  import { isInGroup } from "@svelte-draw/element";

  import type { Degrees } from "@svelte-draw/math";

  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";

  import type { Scene } from "@svelte-draw/element";

  import { angleIcon } from "../icons";

  import DragInput from "./DragInput.svelte";
  import { trackSceneNonce } from "./sceneNonce";
  import { getStepSizedValue, isPropertyEditable } from "./utils";

  import type { DragInputCallbackType } from "./DragInput";
  import type { AppState } from "../../types";

  interface MultiAngleProps {
    elements: readonly NonDeletedExcalidrawElement[];
    scene: Scene;
    appState: AppState;
    property: "angle";
  }

  const STEP_SIZE = 15;

  const handleDegreeChange: DragInputCallbackType<
    MultiAngleProps["property"]
  > = ({
    accumulatedChange,
    originalElements,
    shouldChangeByStepSize,
    nextValue,
    property,
    scene,
  }) => {
    const elementsMap = scene.getNonDeletedElementsMap();
    const editableLatestIndividualElements = originalElements
      .map((el) => elementsMap.get(el.id))
      .filter((el) => el && !isInGroup(el) && isPropertyEditable(el, property));
    const editableOriginalIndividualElements = originalElements.filter(
      (el) => !isInGroup(el) && isPropertyEditable(el, property),
    );

    if (nextValue !== undefined) {
      const nextAngle = degreesToRadians(nextValue as Degrees);

      for (const element of editableLatestIndividualElements) {
        if (!element) {
          continue;
        }
        scene.mutateElement(element, {
          angle: nextAngle,
        });

        const boundTextElement = getBoundTextElement(element, elementsMap);
        if (boundTextElement && !isArrowElement(element)) {
          scene.mutateElement(boundTextElement, { angle: nextAngle });
        }
      }

      scene.triggerUpdate();

      return;
    }

    for (let i = 0; i < editableLatestIndividualElements.length; i++) {
      const latestElement = editableLatestIndividualElements[i];
      if (!latestElement) {
        continue;
      }
      const originalElement = editableOriginalIndividualElements[i];
      const originalAngleInDegrees =
        Math.round(radiansToDegrees(originalElement.angle) * 100) / 100;
      const changeInDegrees = Math.round(accumulatedChange);
      let nextAngleInDegrees = (originalAngleInDegrees + changeInDegrees) % 360;
      if (shouldChangeByStepSize) {
        nextAngleInDegrees = getStepSizedValue(nextAngleInDegrees, STEP_SIZE);
      }

      nextAngleInDegrees =
        nextAngleInDegrees < 0 ? nextAngleInDegrees + 360 : nextAngleInDegrees;

      const nextAngle = degreesToRadians(nextAngleInDegrees as Degrees);

      scene.mutateElement(latestElement, {
        angle: nextAngle,
      });

      const boundTextElement = getBoundTextElement(latestElement, elementsMap);
      if (boundTextElement && !isArrowElement(latestElement)) {
        scene.mutateElement(boundTextElement, { angle: nextAngle });
      }
    }
    scene.triggerUpdate();
  };
</script>

<script lang="ts">

  let { elements, scene, appState, property }: MultiAngleProps = $props();

  const nonce = trackSceneNonce(() => scene);
  const editableLatestIndividualElements = $derived(
    elements.filter((el) => !isInGroup(el) && isPropertyEditable(el, "angle")),
  );
  const value = $derived.by(() => {
    nonce();
    const angles = editableLatestIndividualElements.map(
      (el) => Math.round((radiansToDegrees(el.angle) % 360) * 100) / 100,
    );
    return new Set(angles).size === 1 ? angles[0] : "Mixed";
  });
  const editable = $derived(
    editableLatestIndividualElements.some((el) =>
      isPropertyEditable(el, "angle"),
    ),
  );
</script>

<DragInput
  label="A"
  icon={angleIcon}
  {value}
  {elements}
  dragInputCallback={handleDegreeChange}
  {editable}
  {appState}
  {scene}
  {property}
/>
