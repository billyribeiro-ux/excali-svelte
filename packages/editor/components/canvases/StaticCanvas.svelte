<script lang="ts">
  import { isShallowEqual } from "@svelte-draw/common";

  import type {
    NonDeletedExcalidrawElement,
    NonDeletedSceneElementsMap,
  } from "@svelte-draw/element/types";

  import { isRenderThrottlingEnabled } from "../../renderUtils";
  import { renderStaticScene } from "../../renderer/staticScene";

  import type {
    RenderableElementsMap,
    StaticCanvasRenderConfig,
  } from "../../scene/types";
  import type { AppState, StaticCanvasAppState } from "../../types";
  import type { RoughCanvas } from "roughjs/bin/canvas";

  type Props = {
    /** changes after every editor commit, once `componentDidUpdate` ran */
    paintEpoch: number;
    /** true while the editor is mid-commit: painting waits for `paintEpoch` */
    isPaintDeferred: () => boolean;
    canvas: HTMLCanvasElement;
    rc: RoughCanvas;
    elementsMap: RenderableElementsMap;
    allElementsMap: NonDeletedSceneElementsMap;
    visibleElements: readonly NonDeletedExcalidrawElement[];
    canvasNonce: string;
    selectionNonce: number | undefined;
    scale: number;
    appState: StaticCanvasAppState;
    renderConfig: StaticCanvasRenderConfig;
  };

  let {
    paintEpoch,
    isPaintDeferred,
    canvas,
    rc,
    elementsMap,
    allElementsMap,
    visibleElements,
    canvasNonce,
    scale,
    appState,
    renderConfig,
  }: Props = $props();

  let wrapper: HTMLDivElement | null = $state(null);

  const getRelevantAppStateProps = (
    appState: AppState,
  ): StaticCanvasAppState => ({
    zoom: appState.zoom,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    width: appState.width,
    height: appState.height,
    viewModeEnabled: appState.viewModeEnabled,
    openDialog: appState.openDialog,
    hoveredElementIds: appState.hoveredElementIds,
    offsetLeft: appState.offsetLeft,
    offsetTop: appState.offsetTop,
    theme: appState.theme,
    shouldCacheIgnoreZoom: appState.shouldCacheIgnoreZoom,
    viewBackgroundColor: appState.viewBackgroundColor,
    exportScale: appState.exportScale,
    selectedElementsAreBeingDragged: appState.selectedElementsAreBeingDragged,
    gridSize: appState.gridSize,
    gridStep: appState.gridStep,
    frameRendering: appState.frameRendering,
    selectedElementIds: appState.selectedElementIds,
    frameToHighlight: appState.frameToHighlight,
    editingGroupId: appState.editingGroupId,
    currentHoveredFontFamily: appState.currentHoveredFontFamily,
    croppingElementId: appState.croppingElementId,
    suggestedBinding: appState.suggestedBinding,
  });

  // what the canvas was last drawn with — the equivalent of React.memo's
  // `areEqual` for the previous props
  let drawn: {
    canvasNonce: string;
    scale: number;
    elementsMap: RenderableElementsMap;
    visibleElements: readonly NonDeletedExcalidrawElement[];
    appState: StaticCanvasAppState;
    renderConfig: StaticCanvasRenderConfig;
  } | null = null;
  let isMounted = false;

  // canvas bitmap size follows the viewport size and scale. Depend on the
  // primitive values only (`appState` changes identity on every commit), and
  // never assign `canvas.width/height` unless they differ: assigning clears
  // the bitmap even when the value is unchanged, and nothing would repaint it.
  const viewportWidth = $derived(appState.width);
  const viewportHeight = $derived(appState.height);

  $effect(() => {
    const width = viewportWidth;
    const height = viewportHeight;
    const pixelRatio = scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (canvas.width !== width * pixelRatio) {
      canvas.width = width * pixelRatio;
    }
    if (canvas.height !== height * pixelRatio) {
      canvas.height = height * pixelRatio;
    }
  });

  // redraw whenever the editor committed something the static scene depends on
  $effect(() => {
    // React painted in `useEffect`, i.e. after `componentDidUpdate` of the
    // same commit (which e.g. validates embeddables): wait for the epoch bump
    // that follows it
    void paintEpoch;
    if (!wrapper || isPaintDeferred()) {
      return;
    }

    const nextAppState = getRelevantAppStateProps(appState as AppState);

    if (
      drawn &&
      drawn.canvasNonce === canvasNonce &&
      drawn.scale === scale &&
      // we need to memoize on elementsMap because they may have renewed
      // even if canvasNonce didn't change (e.g. we filter elements out based
      // on appState)
      drawn.elementsMap === elementsMap &&
      drawn.visibleElements === visibleElements &&
      isShallowEqual(drawn.appState, nextAppState) &&
      isShallowEqual(drawn.renderConfig, renderConfig)
    ) {
      return;
    }

    drawn = {
      canvasNonce,
      scale,
      elementsMap,
      visibleElements,
      appState: nextAppState,
      renderConfig,
    };

    if (!isMounted) {
      isMounted = true;

      // eslint-disable-next-line svelte/no-dom-manipulating -- the canvas element is created imperatively (shared with the renderer), not by the template
      wrapper.replaceChildren(canvas);
      canvas.classList.add("excalidraw__canvas", "static");
    }

    renderStaticScene(
      {
        canvas,
        rc,
        scale,
        elementsMap,
        allElementsMap,
        visibleElements,
        appState,
        renderConfig,
      },
      isRenderThrottlingEnabled(),
    );
  });
</script>

<div class="excalidraw__canvas-wrapper" bind:this={wrapper}></div>
