<script module lang="ts">
  import { degreesToRadians, radiansToDegrees } from "@svelte-draw/math";

  import { getBoundTextElement } from "@svelte-draw/element";
  import { isArrowElement, isElbowArrow } from "@svelte-draw/element";

  import { updateBindings } from "@svelte-draw/element";

  import type { Degrees } from "@svelte-draw/math";

  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";

  import type { Scene } from "@svelte-draw/element";

  import { angleIcon } from "../icons";

  import DragInput from "./DragInput.svelte";
  import { trackSceneNonce } from "./sceneNonce";
  import { getStepSizedValue, isPropertyEditable } from "./utils";

  import type { DragInputCallbackType } from "./DragInput";
  import type { AppState } from "../../types";

  interface AngleProps {
    element: NonDeletedExcalidrawElement;
    scene: Scene;
    appState: AppState;
    property: "angle";
  }

  const STEP_SIZE = 15;

  const handleDegreeChange: DragInputCallbackType<AngleProps["property"]> = ({
    accumulatedChange,
    originalElements,
    shouldChangeByStepSize,
    nextValue,
    scene,
    app,
  }) => {
    const elementsMap = scene.getNonDeletedElementsMap();
    const origElement = originalElements[0];
    if (origElement && !isElbowArrow(origElement)) {
      const latestElement = elementsMap.get(origElement.id);
      if (!latestElement) {
        return;
      }

      if (nextValue !== undefined) {
        const nextAngle = degreesToRadians(nextValue as Degrees);
        scene.mutateElement(latestElement, {
          angle: nextAngle,
        });
        updateBindings(latestElement, scene, app.state);

        const boundTextElement = getBoundTextElement(latestElement, elementsMap);
        if (boundTextElement && !isArrowElement(latestElement)) {
          scene.mutateElement(boundTextElement, { angle: nextAngle });
        }

        return;
      }

      const originalAngleInDegrees =
        Math.round(radiansToDegrees(origElement.angle) * 100) / 100;
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
      updateBindings(latestElement, scene, app.state);

      const boundTextElement = getBoundTextElement(latestElement, elementsMap);
      if (boundTextElement && !isArrowElement(latestElement)) {
        scene.mutateElement(boundTextElement, { angle: nextAngle });
      }
    }
  };
</script>

<script lang="ts">


  let { element, scene, appState, property }: AngleProps = $props();

  const nonce = trackSceneNonce(() => scene);
  const value = $derived.by(() => {
    nonce();
    return Math.round((radiansToDegrees(element.angle) % 360) * 100) / 100;
  });
  const editable = $derived(isPropertyEditable(element, "angle"));
</script>

<DragInput
  label="A"
  icon={angleIcon}
  {value}
  elements={[element]}
  dragInputCallback={handleDegreeChange}
  {editable}
  {scene}
  {appState}
  {property}
/>
