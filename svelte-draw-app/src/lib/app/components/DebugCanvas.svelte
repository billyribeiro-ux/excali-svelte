<script lang="ts">
  import type { AppState } from "@svelte-draw/editor/types";

  type Props = {
    appState: AppState;
    scale: number;
    /** the canvas element (replaces the React `ref`), pass to `debugRenderer` */
    element?: HTMLCanvasElement | null;
  };

  let { appState, scale, element = $bindable(null) }: Props = $props();

  const width = $derived(appState.width);
  const height = $derived(appState.height);
</script>

<canvas
  style="width: {width}px; height: {height}px; position: absolute; z-index: 2; pointer-events: none;"
  width={width * scale}
  height={height * scale}
  bind:this={element}
>
  Debug Canvas
</canvas>
