<script lang="ts">
  import type { Snippet } from "svelte";

  import { POINTER_EVENTS, ZEN_MODE_TRANSITION_DURATION } from "@svelte-draw/common";
  import {
    isIframeElement,
    isMagicFrameElement,
  } from "@svelte-draw/element";

  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";
  import { RIGHT_SIDEBAR_WIDTH } from "./App.viewport";
  import { TOOL_DRAG_PREVIEW_OPACITY } from "./App.toolDrag";

  import ContextMenu from "./ContextMenu.svelte";
  import ConvertElementTypePopup from "./ConvertElementTypePopup.svelte";
  import CursorHint from "./CursorHint.svelte";
  import ElementCanvasButtons from "./ElementCanvasButtons.svelte";
  import Embeddables from "./Embeddables.svelte";
  import FileDropOverlay from "./FileDropOverlay.svelte";
  import FrameNames from "./FrameNames.svelte";
  import Hyperlink from "./hyperlink/Hyperlink.svelte";
  import { MagicIcon, copyIcon, fullscreenIcon } from "./icons";
  import LayerUI from "./LayerUI.svelte";
  import MagicButton from "./MagicButton.svelte";
  import SVGLayer from "./SVGLayer.svelte";
  import UnlockPopup from "./UnlockPopup.svelte";
  import ViewportStatusBorder from "./ViewportStatusFrame/ViewportStatusBorder.svelte";
  import InteractiveCanvas from "./canvases/InteractiveCanvas.svelte";
  import NewElementCanvas from "./canvases/NewElementCanvas.svelte";
  import StaticCanvas from "./canvases/StaticCanvas.svelte";

  import type { App } from "../types";
  import type { RenderModel } from "./renderModel";

  type Props = {
    app: App;
    /** computed by `app.computeRenderModel()` on every editor commit */
    model: RenderModel;
    /** changes after every editor commit, once `componentDidUpdate` ran */
    paintEpoch: number;
    /** the host's children (menus, footer, welcome screen, sidebars, …) */
    children?: Snippet;
  };

  let { app, model, paintEpoch, children }: Props = $props();

  // reactive editor state, kept in sync by the commit listener
  const ctx = getEditorContext();

  const api = $derived(app.viewApi);
  const appState = $derived(ctx.appState);
  const appProps = $derived(ctx.props);
  const flags = $derived(model.flags);
  const firstSelectedElement = $derived(model.firstSelectedElement);
  const selectedElements = $derived(model.selectedElements);

  /**
   * Hands the editor container element to the editor
   * (`excalidrawContainerRef`). It is released by `EditorHost` *after*
   * `componentWillUnmount`, which still reads it (Svelte tears children down
   * before their parent, unlike React).
   */
  const registerContainer = (element: HTMLDivElement) => {
    app.excalidrawContainerRef.current = element;
  };
</script>

<!--
  The editor surface. Focusable container with the editor's own (non-delegated
  semantics) keyboard/drop/pointer handlers — it is an application region, not a
  native control.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
<div
  translate="no"
  class={[
    "excalidraw excalidraw-container notranslate",
    appProps.className,
    model.containerClasses,
  ]}
  style:--ui-pointerEvents={model.shouldBlockPointerEvents
    ? POINTER_EVENTS.disabled
    : POINTER_EVENTS.enabled}
  style:--right-sidebar-width="{RIGHT_SIDEBAR_WIDTH}px"
  style:--zen-mode-transition-duration="{ZEN_MODE_TRANSITION_DURATION}ms"
  {@attach registerContainer}
  ondrop={flags.fileDropEnabled ? api.onAppDrop : undefined}
  tabindex="0"
  onkeydown={appProps.handleKeyboardGlobally || !flags.interactionEnabled
    ? undefined
    : api.onKeyDown}
  onpointerenter={flags.interactionEnabled
    ? api.toggleOverscrollBehavior
    : undefined}
  onpointerleave={flags.interactionEnabled
    ? api.toggleOverscrollBehavior
    : undefined}
>
  <LayerUI
    canvas={app.canvas}
    defaultUIEnabled={flags.defaultUIEnabled}
    zoomUIEnabled={flags.zoomUIEnabled}
    scrollBackToContentUIEnabled={flags.scrollBackToContentUIEnabled}
    files={app.files}
    onLockToggle={app.toggleLock}
    onPenModeToggle={app.togglePenMode}
    renderTopLeftUI={appProps.renderTopLeftUI}
    renderTopRightUI={appProps.renderTopRightUI}
    renderCustomStats={appProps.renderCustomStats}
    showExitZenModeBtn={flags.showExitZenModeBtn}
    renderWelcomeScreen={flags.renderWelcomeScreen}
    isCollaborating={appProps.isCollaborating}
    currentUserControls={appProps.currentUserControls}
  >
    {#if children}
      {@render children()}
    {/if}
  </LayerUI>

  <div class="excalidraw-textEditorContainer"></div>
  <div class="excalidraw-contextMenuContainer"></div>
  <div class="excalidraw-eye-dropper-container"></div>
  <SVGLayer trails={model.trails as any} />
  {#if flags.defaultUIEnabled}
    <CursorHint />
  {/if}
  {#if flags.defaultUIEnabled && flags.interactionEnabled && !appState.viewModeEnabled}
    <FileDropOverlay />
  {/if}
  {#if flags.defaultUIEnabled && selectedElements.length === 1 && appState.openDialog?.name !== "elementLinkSelector" && appState.showHyperlinkPopup && firstSelectedElement}
    {#key firstSelectedElement.id}
      <Hyperlink
        element={firstSelectedElement}
        scene={app.scene}
        setAppState={app.setAppState}
        onLinkOpen={appProps.onLinkOpen}
        setToast={app.setToast}
        updateEmbedValidationStatus={api.updateEmbedValidationStatus}
      />
    {/key}
  {/if}
  {#if flags.defaultUIEnabled && appProps.aiEnabled !== false && selectedElements.length === 1 && firstSelectedElement && isMagicFrameElement(firstSelectedElement)}
    <ElementCanvasButtons
      element={firstSelectedElement}
      elementsMap={model.renderableElementsMap}
    >
      <MagicButton
        title={t("labels.convertToCode")}
        icon={MagicIcon}
        checked={false}
        onChange={() =>
          api.onMagicFrameGenerate(firstSelectedElement, "button")}
      />
    </ElementCanvasButtons>
  {/if}
  {#if flags.defaultUIEnabled && selectedElements.length === 1 && firstSelectedElement && isIframeElement(firstSelectedElement) && firstSelectedElement.customData?.generationData?.status === "done"}
    <ElementCanvasButtons
      element={firstSelectedElement}
      elementsMap={model.renderableElementsMap}
    >
      <MagicButton
        title={t("labels.copySource")}
        icon={copyIcon}
        checked={false}
        onChange={() => api.onIframeSrcCopy(firstSelectedElement)}
      />
      <MagicButton
        title="Enter fullscreen"
        icon={fullscreenIcon}
        checked={false}
        onChange={() => {
          const iframe = api.getHTMLIFrameElement(firstSelectedElement);
          if (iframe) {
            try {
              iframe.requestFullscreen();
              app.setState({
                activeEmbeddable: {
                  element: firstSelectedElement,
                  state: "active",
                },
                selectedElementIds: {
                  [firstSelectedElement.id]: true,
                },
                newElement: null,
                selectionElement: null,
              });
            } catch (err: any) {
              console.warn(err);
              app.setState({
                errorMessage: "Couldn't enter fullscreen",
              });
            }
          }
        }}
      />
    </ElementCanvasButtons>
  {/if}

  {#if flags.defaultUIEnabled && appState.contextMenu}
    <ContextMenu
      items={appState.contextMenu.items}
      top={appState.contextMenu.top}
      left={appState.contextMenu.left}
      actionManager={app.actionManager}
      onClose={(callback) => {
        app.setState({ contextMenu: null }, () => {
          app.focusContainer();
          callback?.();
        });
      }}
    />
  {/if}
  <StaticCanvas
    {paintEpoch}
    isPaintDeferred={() => app.paintDeferred}
    canvas={app.canvas}
    rc={app.rc}
    elementsMap={model.renderableElementsMap}
    allElementsMap={model.allElementsMap}
    visibleElements={model.staticVisibleElements}
    canvasNonce={model.canvasNonce}
    selectionNonce={appState.selectionElement?.versionNonce}
    scale={model.devicePixelRatio}
    {appState}
    renderConfig={model.staticRenderConfig}
  />
  {#if model.previewElement}
    <NewElementCanvas
      {paintEpoch}
      isPaintDeferred={() => app.paintDeferred}
      {appState}
      newElement={model.previewElement}
      scale={model.devicePixelRatio}
      rc={app.rc}
      elementsMap={model.renderableElementsMap}
      allElementsMap={model.allElementsMap}
      renderConfig={model.newElementRenderConfig}
      opacity={model.isToolDragPreview ? TOOL_DRAG_PREVIEW_OPACITY : undefined}
    />
  {/if}
  <InteractiveCanvas
    {app}
    containerRef={app.excalidrawContainerRef}
    canvas={app.interactiveCanvas}
    elementsMap={model.renderableElementsMap}
    visibleElements={model.visibleElements}
    allElementsMap={model.allElementsMap}
    selectedElements={model.selectedElements}
    canvasNonce={model.canvasNonce}
    selectionNonce={appState.selectionElement?.versionNonce}
    scale={model.devicePixelRatio}
    {appState}
    renderScrollbars={appProps.renderScrollbars === true}
    editorInterface={ctx.editorInterface}
    interactionEnabled={flags.interactionEnabled}
    navigationEnabled={flags.navigationEnabled}
    renderInteractiveSceneCallback={api.renderInteractiveSceneCallback}
    handleCanvasRef={api.handleInteractiveCanvasRef}
    onContextMenu={api.onCanvasContextMenu}
    onClick={api.onCanvasClick}
    onPointerMove={api.onCanvasPointerMove}
    onPointerUp={api.onCanvasPointerUp}
    onPointerCancel={api.onCanvasPointerCancel}
    onTouchMove={api.onTouchMove}
    onPointerDown={api.onCanvasPointerDown}
    onDoubleClick={api.onCanvasDoubleClick}
  />
  {#if appProps.viewportStatusFrame?.border && ctx.editorInterface.formFactor === "phone"}
    <ViewportStatusBorder border={appProps.viewportStatusFrame.border} />
  {/if}
  <FrameNames {app} {appState} frames={model.frameNames} />
  {#if flags.defaultUIEnabled && appState.activeLockedId}
    <UnlockPopup {app} activeLockedId={appState.activeLockedId} />
  {/if}
  {#if flags.defaultUIEnabled && model.showShapeSwitchPanel}
    <ConvertElementTypePopup {app} />
  {/if}
  <Embeddables {app} {appState} embeddables={model.embeddables} />
</div>
