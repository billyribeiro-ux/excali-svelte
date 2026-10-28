<script lang="ts">
  import {
    isShallowEqual,
    sceneCoordsToViewportCoords,
    type EditorInterface,
  } from "@svelte-draw/common";

  import type {
    InteractiveCanvasRenderConfig,
    InteractiveSceneRenderAnimationState,
    InteractiveSceneRenderConfig,
    RenderableElementsMap,
    RenderInteractiveSceneCallback,
  } from "@svelte-draw/editor/scene/types";

  import type {
    NonDeletedExcalidrawElement,
    NonDeletedSceneElementsMap,
  } from "@svelte-draw/element/types";

  import { t } from "../../i18n";
  import { getSelectionColor } from "../../renderer/helpers";
  import { renderInteractiveScene } from "../../renderer/interactiveScene";

  import { AnimationController } from "../../renderer/animation";

  import type {
    AppClassProperties,
    AppState,
    InteractiveCanvasAppState,
  } from "../../types";

  type Props = {
    containerRef: { current: HTMLDivElement | null };
    canvas: HTMLCanvasElement | null;
    elementsMap: RenderableElementsMap;
    visibleElements: readonly NonDeletedExcalidrawElement[];
    selectedElements: readonly NonDeletedExcalidrawElement[];
    allElementsMap: NonDeletedSceneElementsMap;
    canvasNonce: string;
    selectionNonce: number | undefined;
    scale: number;
    appState: InteractiveCanvasAppState;
    renderScrollbars: boolean;
    editorInterface: EditorInterface;
    app: AppClassProperties;
    interactionEnabled: boolean;
    navigationEnabled: boolean;
    renderInteractiveSceneCallback: (
      data: RenderInteractiveSceneCallback,
    ) => void;
    handleCanvasRef: (canvas: HTMLCanvasElement | null) => void;
    onContextMenu: (event: MouseEvent) => void;
    onClick: (event: MouseEvent) => void;
    onPointerMove: (event: PointerEvent) => void;
    onPointerUp: (event: PointerEvent) => void;
    onPointerCancel: (event: PointerEvent) => void;
    onTouchMove: (event: TouchEvent) => void;
    onPointerDown: (event: PointerEvent) => void;
    onDoubleClick: (event: MouseEvent) => void;
  };

  let {
    containerRef,
    canvas,
    elementsMap,
    visibleElements,
    selectedElements,
    allElementsMap,
    canvasNonce,
    selectionNonce,
    scale,
    appState,
    renderScrollbars,
    editorInterface,
    app,
    interactionEnabled,
    navigationEnabled,
    renderInteractiveSceneCallback,
    handleCanvasRef,
    onContextMenu,
    onClick,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onTouchMove,
    onPointerDown,
    onDoubleClick,
  }: Props = $props();

  let canvasElement: HTMLCanvasElement | null = $state(null);

  const getRelevantAppStateProps = (
    appState: AppState,
  ): InteractiveCanvasAppState => ({
    zoom: appState.zoom,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    width: appState.width,
    height: appState.height,
    viewModeEnabled: appState.viewModeEnabled,
    activeTool: appState.activeTool,
    openDialog: appState.openDialog,
    editingGroupId: appState.editingGroupId,
    selectedElementIds: appState.selectedElementIds,
    frameToHighlight: appState.frameToHighlight,
    offsetLeft: appState.offsetLeft,
    offsetTop: appState.offsetTop,
    theme: appState.theme,
    selectionElement: appState.selectionElement,
    selectedGroupIds: appState.selectedGroupIds,
    selectedLinearElement: appState.selectedLinearElement,
    multiElement: appState.multiElement,
    newElement: appState.newElement,
    isBindingEnabled: appState.isBindingEnabled,
    isMidpointSnappingEnabled: appState.isMidpointSnappingEnabled,
    gridModeEnabled: appState.gridModeEnabled,
    suggestedBinding: appState.suggestedBinding,
    textToolHover: appState.textToolHover,
    isRotating: appState.isRotating,
    elementsToHighlight: appState.elementsToHighlight,
    collaborators: appState.collaborators, // Necessary for collab. sessions
    activeEmbeddable: appState.activeEmbeddable,
    snapLines: appState.snapLines,
    zenModeEnabled: appState.zenModeEnabled,
    editingTextElement: appState.editingTextElement,
    isCropping: appState.isCropping,
    croppingElementId: appState.croppingElementId,
    searchMatches: appState.searchMatches,
    activeLockedId: appState.activeLockedId,
    hoveredElementIds: appState.hoveredElementIds,
    frameRendering: appState.frameRendering,
    shouldCacheIgnoreZoom: appState.shouldCacheIgnoreZoom,
    exportScale: appState.exportScale,
    currentItemArrowType: appState.currentItemArrowType,
  });

  let rendererParams: InteractiveSceneRenderConfig | null = null;
  // Unique per mounted instance so concurrent editors don't share the
  // interactive scene animation slot.
  const animationKey = Symbol("interactiveSceneAnimation");

  // what the scene was last (re)configured with — the equivalent of
  // React.memo's `areEqual` for the previous props
  let seen: {
    selectionNonce: number | undefined;
    canvasNonce: string;
    scale: number;
    elementsMap: RenderableElementsMap;
    visibleElements: readonly NonDeletedExcalidrawElement[];
    selectedElements: readonly NonDeletedExcalidrawElement[];
    renderScrollbars: boolean;
    interactionEnabled: boolean;
    navigationEnabled: boolean;
    appState: InteractiveCanvasAppState;
  } | null = null;
  let isMounted = false;

  // hands the element to the editor like React's callback ref (element on
  // mount, null on unmount)
  $effect(() => {
    if (!canvasElement) {
      return;
    }
    const element = canvasElement;
    handleCanvasRef(element);
    return () => {
      handleCanvasRef(null);
    };
  });

  $effect(() => {
    return () => {
      AnimationController.cancel(animationKey);
    };
  });

  $effect(() => {
    const nextAppState = getRelevantAppStateProps(appState as AppState);

    const unchanged =
      seen !== null &&
      seen.selectionNonce === selectionNonce &&
      seen.canvasNonce === canvasNonce &&
      seen.scale === scale &&
      // we need to memoize on elementsMap because they may have renewed
      // even if canvasNonce didn't change (e.g. we filter elements out based
      // on appState)
      seen.elementsMap === elementsMap &&
      seen.visibleElements === visibleElements &&
      seen.selectedElements === selectedElements &&
      seen.renderScrollbars === renderScrollbars &&
      seen.interactionEnabled === interactionEnabled &&
      seen.navigationEnabled === navigationEnabled &&
      // Comparing the interactive appState for changes in case of some edge cases
      isShallowEqual(seen.appState, nextAppState);

    if (unchanged) {
      return;
    }

    seen = {
      selectionNonce,
      canvasNonce,
      scale,
      elementsMap,
      visibleElements,
      selectedElements,
      renderScrollbars,
      interactionEnabled,
      navigationEnabled,
      appState: nextAppState,
    };

    if (!isMounted) {
      isMounted = true;
      return;
    }

    const remotePointerButton: InteractiveCanvasRenderConfig["remotePointerButton"] =
      new Map();
    const remotePointerViewportCoords: InteractiveCanvasRenderConfig["remotePointerViewportCoords"] =
      new Map();
    const remoteSelectedElementIds: InteractiveCanvasRenderConfig["remoteSelectedElementIds"] =
      new Map();
    const remotePointerUsernames: InteractiveCanvasRenderConfig["remotePointerUsernames"] =
      new Map();
    const remotePointerUserStates: InteractiveCanvasRenderConfig["remotePointerUserStates"] =
      new Map();

    appState.collaborators.forEach((user, socketId) => {
      if (user.selectedElementIds) {
        for (const id of Object.keys(user.selectedElementIds)) {
          if (!remoteSelectedElementIds.has(id)) {
            remoteSelectedElementIds.set(id, []);
          }
          remoteSelectedElementIds.get(id)!.push(socketId);
        }
      }
      if (!user.pointer || user.pointer.renderCursor === false) {
        return;
      }
      if (user.username) {
        remotePointerUsernames.set(socketId, user.username);
      }
      if (user.userState) {
        remotePointerUserStates.set(socketId, user.userState);
      }
      remotePointerViewportCoords.set(
        socketId,
        sceneCoordsToViewportCoords(
          {
            sceneX: user.pointer.x,
            sceneY: user.pointer.y,
          },
          appState,
        ),
      );
      remotePointerButton.set(socketId, user.button);
    });

    const selectionColor = getSelectionColor(containerRef?.current);

    rendererParams = {
      app,
      canvas,
      elementsMap,
      visibleElements,
      selectedElements,
      allElementsMap,
      scale,
      appState,
      renderConfig: {
        remotePointerViewportCoords,
        remotePointerButton,
        remoteSelectedElementIds,
        remotePointerUsernames,
        remotePointerUserStates,
        selectionColor,
        renderScrollbars,
        // NOTE not memoized on so we don't rerender on cursor move
        lastViewportPosition: app.viewport.lastPosition,
      },
      editorInterface,
      callback: renderInteractiveSceneCallback,
      animationState: {
        bindingHighlight: undefined,
      },
      deltaTime: 0,
    };

    if (!AnimationController.running(animationKey)) {
      AnimationController.start<InteractiveSceneRenderAnimationState>(
        animationKey,
        ({ deltaTime, state }) => {
          const nextAnimationState = renderInteractiveScene({
            ...rendererParams!,
            deltaTime,
            animationState: state,
          }).animationState;

          if (nextAnimationState) {
            for (const key in nextAnimationState) {
              if (
                nextAnimationState[
                  key as keyof InteractiveSceneRenderAnimationState
                ] !== undefined
              ) {
                return nextAnimationState;
              }
            }
          }

          return undefined;
        },
        app.ownerWindow,
      );
    }
  });
</script>

<!--
  NOTE no `cursor` style here — the cursor is managed imperatively
  (see `AppCursor`); an inline style would clobber it whenever its
  computed value changes across rerenders.
  NOTE all the handlers early-exit in App when the editor is
  non-interactive (running only a restricted, link-only code path if
  `interaction.allowed.links` is enabled), so they're safe to bind
  unconditionally.
-->
<canvas
  class="excalidraw__canvas interactive"
  style:width="{appState.width}px"
  style:height="{appState.height}px"
  width={appState.width * scale}
  height={appState.height * scale}
  bind:this={canvasElement}
  oncontextmenu={onContextMenu}
  onclick={onClick}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerCancel}
  ontouchmove={onTouchMove}
  onpointerdown={onPointerDown}
  ondblclick={appState.viewModeEnabled ? undefined : onDoubleClick}
>
  {t("labels.drawingCanvas")}
</canvas>
