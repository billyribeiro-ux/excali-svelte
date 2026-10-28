<script module lang="ts">
  import { getNormalizedGridStep } from "../../scene";

  import DragInput from "./DragInput.svelte";
  import { getStepSizedValue } from "./utils";

  import type { Scene } from "@svelte-draw/element";
  import type { AppClassProperties, AppState } from "../../types";

  interface PositionProps {
    property: "gridStep";
    scene: Scene;
    appState: AppState;
    setAppState: AppClassProperties["setAppState"];
  }

  const STEP_SIZE = 5;
</script>

<script lang="ts">
  let { property, scene, appState, setAppState }: PositionProps = $props();
</script>

<DragInput
  label="Grid step"
  sensitivity={8}
  elements={[]}
  dragInputCallback={({
    nextValue,
    instantChange,
    shouldChangeByStepSize,
    setInputValue,
  }) => {
    setAppState((state) => {
      let nextGridStep;

      if (nextValue) {
        nextGridStep = nextValue;
      } else if (instantChange) {
        nextGridStep = shouldChangeByStepSize
          ? getStepSizedValue(
              state.gridStep + STEP_SIZE * Math.sign(instantChange),
              STEP_SIZE,
            )
          : state.gridStep + instantChange;
      }

      if (!nextGridStep) {
        setInputValue(state.gridStep);
        return null;
      }

      nextGridStep = getNormalizedGridStep(nextGridStep);
      setInputValue(nextGridStep);
      return {
        gridStep: nextGridStep,
      };
    });
  }}
  {scene}
  value={appState.gridStep}
  {property}
  {appState}
/>
