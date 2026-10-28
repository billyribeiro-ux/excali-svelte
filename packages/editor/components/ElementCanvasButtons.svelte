<script lang="ts">
  import { sceneCoordsToViewportCoords } from "@svelte-draw/common";
  import { getElementAbsoluteCoords } from "@svelte-draw/element";

  import { getEditorContext } from "../ui/editorContext";

  import type { Snippet } from "svelte";
  import type {
    ElementsMap,
    NonDeletedExcalidrawElement,
  } from "@svelte-draw/element/types";

  import "./ElementCanvasButtons.scss";

  const CONTAINER_PADDING = 5;

  type Props = {
    children: Snippet;
    element: NonDeletedExcalidrawElement;
    elementsMap: ElementsMap;
  };

  let { children, element, elementsMap }: Props = $props();

  const ctx = getEditorContext();

  const hidden = $derived(
    !!(
      ctx.appState.contextMenu ||
      ctx.appState.newElement ||
      ctx.appState.resizingElement ||
      ctx.appState.isRotating ||
      ctx.appState.openMenu ||
      ctx.appState.viewModeEnabled
    ),
  );

  const coords = $derived.by(() => {
    if (hidden) {
      return null;
    }
    const appState = ctx.appState;
    const [x1, y1] = getElementAbsoluteCoords(element, elementsMap);
    const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
      { sceneX: x1 + element.width, sceneY: y1 },
      appState,
    );
    return {
      x: viewportX - appState.offsetLeft + 10,
      y: viewportY - appState.offsetTop,
    };
  });
</script>

{#if coords}
  <div
    class="excalidraw-canvas-buttons"
    style:top="{coords.y}px"
    style:left="{coords.x}px"
    style:padding="{CONTAINER_PADDING}px"
  >
    {@render children()}
  </div>
{/if}
