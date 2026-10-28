<script lang="ts">
  import type { NonDeletedSceneElementsMap } from "@svelte-draw/element/types";

  import { isRenderThrottlingEnabled } from "../../renderUtils";
  import { renderNewElementScene } from "../../renderer/renderNewElementScene";

  import type {
    RenderableElementsMap,
    StaticCanvasRenderConfig,
  } from "../../scene/types";
  import type { AppState } from "../../types";
  import type { RoughCanvas } from "roughjs/bin/canvas";

  type Props = {
    /** changes after every editor commit, once `componentDidUpdate` ran */
    paintEpoch: number;
    /** true while the editor is mid-commit: painting waits for `paintEpoch` */
    isPaintDeferred: () => boolean;
    appState: AppState;
    newElement: NonNullable<AppState["newElement"]>;
    elementsMap: RenderableElementsMap;
    allElementsMap: NonDeletedSceneElementsMap;
    scale: number;
    rc: RoughCanvas;
    renderConfig: StaticCanvasRenderConfig;
    /** CSS opacity of the whole canvas — a translucent preview of a finished element */
    opacity?: number;
  };

  let {
    paintEpoch,
    isPaintDeferred,
    appState,
    newElement,
    elementsMap,
    allElementsMap,
    scale,
    rc,
    renderConfig,
    opacity,
  }: Props = $props();

  let canvas: HTMLCanvasElement | null = $state(null);

  // redraws on every commit that reaches this component (as the React
  // version's dependency-less effect did)
  $effect(() => {
    void paintEpoch;
    if (!canvas || isPaintDeferred()) {
      return;
    }
    renderNewElementScene(
      {
        canvas,
        scale,
        newElement,
        elementsMap,
        allElementsMap,
        rc,
        renderConfig,
        appState,
      },
      isRenderThrottlingEnabled(),
    );
  });
</script>

<canvas
  class="excalidraw__canvas"
  style:width="{appState.width}px"
  style:height="{appState.height}px"
  style:opacity
  width={appState.width * scale}
  height={appState.height * scale}
  bind:this={canvas}
></canvas>
