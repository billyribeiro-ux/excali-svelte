<script lang="ts">
  import type { Snippet } from "svelte";

  import {
    CLASSES,
    DEFAULT_SIDEBAR,
    TOOL_TYPE,
    arrayToMap,
    capitalizeString,
    deriveStylesPanelMode,
  } from "@svelte-draw/common";
  import {
    getColorUpdate,
    mutateElement,
    showSelectedShapeActions,
    ShapeCache,
  } from "@svelte-draw/element";

  import { actionToggleStats } from "../actions";
  import {
    getColorTargetAppStateUpdates,
    resolveColorTarget,
    type ColorDefaultKey,
  } from "../actions/colorTargets";
  import { trackEvent } from "../analytics";
  import { initializeTunnels, setTunnels } from "../context/tunnels";
  import { useAtom, useAtomValue } from "../editor-jotai";
  import { t } from "../i18n";
  import { getScrollToContentState, getSelectedElements } from "../scene";
  import { getEditorContext } from "../ui/editorContext";
  import TunnelOut from "../ui/TunnelOut.svelte";

  import ActiveConfirmDialog from "./ActiveConfirmDialog.svelte";
  import CompactShapeActions from "./CompactShapeActions.svelte";
  import DefaultSidebar from "./DefaultSidebar.svelte";
  import DefaultSidebarTrigger from "./DefaultSidebarTrigger.svelte";
  import ElementLinkDialog from "./ElementLinkDialog.svelte";
  import ErrorDialog from "./ErrorDialog.svelte";
  import EyeDropper from "./EyeDropper.svelte";
  import { activeEyeDropperAtom } from "./EyeDropper";
  import FixedSideContainer from "./FixedSideContainer.svelte";
  import Footer from "./footer/Footer.svelte";
  import HelpDialog from "./HelpDialog.svelte";
  import ImageExportDialog from "./ImageExportDialog.svelte";
  import Island from "./Island.svelte";
  import JSONExportDialog from "./JSONExportDialog.svelte";
  import LaserPointerButton from "./LaserPointerButton.svelte";
  import LoadingMessage from "./LoadingMessage.svelte";
  import MainMenu from "./main-menu/MainMenu.svelte";
  import MainMenuGroup from "./main-menu/MainMenuGroup.svelte";
  import MainMenuSeparator from "./main-menu/MainMenuSeparator.svelte";
  import {
    LoadScene,
    SaveToActiveFile,
    Export,
    SaveAsImage,
    SearchMenu,
    Help,
    ClearCanvas,
    Socials,
    ToggleTheme,
    ChangeCanvasBackground,
  } from "./main-menu/DefaultItems";
  import MobileMenu from "./MobileMenu.svelte";
  import OverwriteConfirmDialog from "./OverwriteConfirm/OverwriteConfirm.svelte";
  import {
    SaveToDisk,
    ExportToImage,
  } from "./OverwriteConfirm/OverwriteConfirmActions";
  import PasteChartDialog from "./PasteChartDialog.svelte";
  import PenModeButton from "./PenModeButton.svelte";
  import SelectedShapeActions from "./SelectedShapeActions.svelte";
  import { isSidebarDockedAtom } from "./Sidebar/Sidebar";
  import StackCol from "./StackCol.svelte";
  import StackRow from "./StackRow.svelte";
  import Stats from "./Stats/Stats.svelte";
  import Toast from "./Toast.svelte";
  import Toolbar from "./Toolbar.svelte";
  import TTDDialog from "./TTDDialog/TTDDialog.svelte";
  import UserList from "./UserList.svelte";
  import ViewportStatusBadge from "./ViewportStatusFrame/ViewportStatusBadge.svelte";
  import ViewportStatusBorder from "./ViewportStatusFrame/ViewportStatusBorder.svelte";
  import { sidebarRightIcon } from "./icons";

  import "./LayerUI.scss";
  import "./Toolbar.scss";

  import type {
    ExcalidrawElement,
    NonDeletedExcalidrawElement,
  } from "@svelte-draw/element/types";

  import type { ColorPickerType } from "./ColorPicker/colorPickerUtils";
  import type {
    BinaryFiles,
    SvelteDrawProps,
    UIAppState,
    AppClassProperties,
    AppState,
  } from "../types";

  /**
   * `actionManager`, `appState`, `setAppState`, `elements`, `app`, `UIOptions`,
   * `onExportImage`, `generateLinkForSelection`, `langCode` come from
   * `getEditorContext()` instead of props. `children` / `render*UI` are
   * snippets.
   */
  type Props = {
    files: BinaryFiles;
    canvas: HTMLCanvasElement;
    onLockToggle: () => void;
    onPenModeToggle: AppClassProperties["togglePenMode"];
    showExitZenModeBtn: boolean;
    renderTopLeftUI?: Snippet<[boolean, UIAppState]>;
    renderTopRightUI?: Snippet<[boolean, UIAppState]>;
    renderCustomStats?: SvelteDrawProps["renderCustomStats"];
    renderWelcomeScreen: boolean;
    children?: Snippet;
    defaultUIEnabled: boolean;
    zoomUIEnabled: boolean;
    scrollBackToContentUIEnabled: boolean;
    isCollaborating: boolean;
    currentUserControls?: SvelteDrawProps["currentUserControls"];
  };

  let {
    files,
    canvas,
    onLockToggle,
    onPenModeToggle,
    showExitZenModeBtn,
    renderTopLeftUI,
    renderTopRightUI,
    renderCustomStats,
    renderWelcomeScreen,
    children,
    defaultUIEnabled,
    zoomUIEnabled,
    scrollBackToContentUIEnabled,
    isCollaborating,
    currentUserControls,
  }: Props = $props();

  const ctx = getEditorContext();
  const tunnels = initializeTunnels();
  setTunnels(tunnels);

  const app = $derived(ctx.app);
  const appState = $derived(ctx.appState);
  const elements = $derived(
    ctx.elements as readonly NonDeletedExcalidrawElement[],
  );
  const UIOptions = $derived(ctx.props.UIOptions);
  const editorInterface = $derived(ctx.editorInterface);
  const isCompactStylesPanel = $derived(
    deriveStylesPanelMode(editorInterface) === "compact",
  );
  const elementsMap = $derived.by(() => {
    void ctx.elements;
    return ctx.app.scene.getNonDeletedElementsMap();
  });

  const spacing = $derived(
    isCompactStylesPanel
      ? {
          menuTopGap: 4,
          toolbarColGap: 4,
          toolbarRowGap: 1,
          toolbarInnerRowGap: 0.5,
          islandPadding: 1,
          collabMarginLeft: 8,
        }
      : {
          menuTopGap: 6,
          toolbarColGap: 4,
          toolbarRowGap: 1,
          toolbarInnerRowGap: 1,
          islandPadding: 1,
          collabMarginLeft: 8,
        },
  );

  const eyeDropper = useAtom(activeEyeDropperAtom);
  const eyeDropperState = $derived(eyeDropper.current);
  const sidebarDocked = useAtomValue(isSidebarDockedAtom);
  const isSidebarDocked = $derived(sidebarDocked.current);
  const isSidebarDockedAndFits = $derived(
    !!(
      appState.openSidebar &&
      isSidebarDocked &&
      editorInterface.canFitSidebar
    ),
  );

  const containerId = $derived(app.excalidrawContainerValue?.id);

  const shouldRenderSelectedShapeActions = $derived(
    defaultUIEnabled && showSelectedShapeActions(appState, elements),
  );
  const shouldShowStats = $derived(
    defaultUIEnabled &&
      appState.stats.open &&
      !appState.zenModeEnabled &&
      !appState.viewModeEnabled &&
      appState.openDialog?.name !== "elementLinkSelector",
  );

  const onEyeDropperChange = (
    colorPickerType: ColorPickerType,
    color: string,
    selectedElements: ExcalidrawElement[],
    { altKey }: { altKey: boolean },
  ) => {
    if (
      colorPickerType !== "elementBackground" &&
      colorPickerType !== "elementStroke"
    ) {
      return;
    }

    const property =
      altKey && eyeDropperState?.swapPreviewOnAlt
        ? colorPickerType === "elementBackground"
          ? "strokeColor"
          : "backgroundColor"
        : colorPickerType === "elementBackground"
        ? "backgroundColor"
        : "strokeColor";

    if (selectedElements.length) {
      const map = arrayToMap(elements);
      // a note's visible text is its label, so stroke picks
      // include bound labels
      const targets = getSelectedElements(elements, appState, {
        includeBoundTextElement: property === "strokeColor",
      });
      for (const element of targets) {
        mutateElement(
          element,
          map,
          getColorUpdate(element, property, color, map),
        );
        ShapeCache.delete(element);
      }
      app.scene.triggerUpdate();
    } else {
      ctx.setAppState(
        getColorTargetAppStateUpdates(
          resolveColorTarget(appState, elements, property),
          color,
        ) as Pick<AppState, ColorDefaultKey>,
      );
    }
  };
</script>

{#snippet sectionHeading(heading: "canvasActions" | "selectedShapeActions" | "shapes")}
  <h2 class="visually-hidden" id="{containerId}-{heading}-title">
    {t(`headings.${heading}`)}
  </h2>
{/snippet}

{#snippet renderJSONExportDialog()}
  {#if UIOptions.canvasActions.export}
    <JSONExportDialog
      {elements}
      {appState}
      {files}
      actionManager={ctx.actionManager}
      exportOpts={UIOptions.canvasActions.export}
      {canvas}
      setAppState={ctx.setAppState}
    />
  {/if}
{/snippet}

{#snippet renderImageExportDialog()}
  {#if UIOptions.canvasActions.saveAsImage && appState.openDialog?.name === "imageExport"}
    <ImageExportDialog
      {elements}
      {appState}
      {files}
      actionManager={ctx.actionManager}
      onExportImage={app.onExportImage}
      onCloseRequest={() => ctx.setAppState({ openDialog: null })}
      name={app.getName()}
    />
  {/if}
{/snippet}

{#snippet renderSidebars()}
  {#if defaultUIEnabled}
    <DefaultSidebar
      __fallback
      onDock={(docked: boolean) => {
        trackEvent(
          "sidebar",
          `toggleDock (${docked ? "dock" : "undock"})`,
          `(${editorInterface.formFactor === "phone" ? "mobile" : "desktop"})`,
        );
      }}
    />
  {/if}
{/snippet}

{#snippet canvasActions()}
  <div style="position: relative;">
    <div class="excalidraw-ui-top-left">
      {@render renderTopLeftUI?.(false, appState)}
      <TunnelOut tunnel={tunnels.MainMenuTunnel} />
    </div>
    {#if renderWelcomeScreen}
      <TunnelOut tunnel={tunnels.WelcomeScreenMenuHintTunnel} />
    {/if}
  </div>
{/snippet}

{#snippet selectedShapeActions()}
  <section
    class={[
      "selected-shape-actions",
      "zen-mode-transition",
      appState.zenModeEnabled && "transition-left",
    ]}
    aria-labelledby="{containerId}-selectedShapeActions-title"
  >
    {@render sectionHeading("selectedShapeActions")}
    {#if isCompactStylesPanel}
      <Island
        class="compact-shape-actions-island"
        padding={0}
        data-viewport-ui="side"
        data-viewport-ui-name="stylesPanel"
        style="max-height: {appState.height - 166}px;"
      >
        <CompactShapeActions {appState} {elementsMap} {app} />
      </Island>
    {:else}
      <Island
        class={CLASSES.SHAPE_ACTIONS_MENU}
        padding={2}
        style="max-height: {appState.height - 166}px;"
        data-viewport-ui="side"
        data-viewport-ui-name="stylesPanel"
      >
        <SelectedShapeActions {appState} {elementsMap} {app} />
      </Island>
    {/if}
  </section>
{/snippet}

{#snippet shapesHeading()}
  {@render sectionHeading("shapes")}
{/snippet}

{#snippet fixedSideContainer()}
  <FixedSideContainer side="top">
    <div class="App-menu App-menu_top">
      <StackCol gap={spacing.menuTopGap} class="App-menu_top__left">
        {@render canvasActions()}
        {#if defaultUIEnabled}
          <div
            class={[
              "selected-shape-actions-container",
              isCompactStylesPanel &&
                "selected-shape-actions-container--compact",
            ]}
          >
            {#if shouldRenderSelectedShapeActions}
              {@render selectedShapeActions()}
            {/if}
          </div>
        {/if}
        <!-- in compact UI the pen mode button lives outside the toolbar, as
             a separate floating button below the compact actions menu
             (same as we render it on mobile); shown alongside the compact
             actions island, i.e. when a drawing tool or elements are
             selected -->
        {#if defaultUIEnabled && isCompactStylesPanel && !appState.viewModeEnabled && shouldRenderSelectedShapeActions}
          <PenModeButton
            checked={appState.penMode}
            onChange={() => onPenModeToggle(null)}
            title={t("toolBar.penMode")}
            isMobile
            penDetected={appState.penDetected}
          />
        {/if}
      </StackCol>
      {#if defaultUIEnabled && !appState.viewModeEnabled && appState.openDialog?.name !== "elementLinkSelector"}
        <section
          class="shapes-section"
          aria-labelledby="{containerId}-shapes-title"
        >
          <div style="position: relative;">
            {#if renderWelcomeScreen}
              <TunnelOut tunnel={tunnels.WelcomeScreenToolbarHintTunnel} />
            {/if}
            <StackCol gap={spacing.toolbarColGap} align="start">
              <StackRow
                gap={spacing.toolbarRowGap}
                class={["App-toolbar-container", appState.zenModeEnabled && "zen-mode"]}
              >
                <Toolbar
                  {app}
                  {appState}
                  setAppState={ctx.setAppState}
                  {UIOptions}
                  {onPenModeToggle}
                  {onLockToggle}
                  heading={shapesHeading}
                />
                {#if isCollaborating}
                  <Island
                    style="margin-left: {spacing.collabMarginLeft}px; align-self: center; height: fit-content;"
                  >
                    <LaserPointerButton
                      title={t("toolBar.laser")}
                      checked={appState.activeTool.type === TOOL_TYPE.laser}
                      onChange={() => app.setActiveTool({ type: TOOL_TYPE.laser })}
                      isMobile
                    />
                  </Island>
                {/if}
              </StackRow>
            </StackCol>
          </div>
        </section>
      {/if}
      <div
        class={[
          "layer-ui__wrapper__top-right",
          "zen-mode-transition",
          appState.zenModeEnabled && "transition-right",
          isCompactStylesPanel && "layer-ui__wrapper__top-right--compact",
        ]}
      >
        {#if defaultUIEnabled && appState.collaborators.size > 0}
          <UserList
            collaborators={appState.collaborators}
            userToFollow={ctx.props.userToFollow?.socketId || null}
            {currentUserControls}
          />
        {/if}
        {@render renderTopRightUI?.(editorInterface.formFactor === "phone", appState)}
        {#if !appState.viewModeEnabled && appState.openDialog?.name !== "elementLinkSelector" && (!isSidebarDocked || appState.openSidebar?.name !== DEFAULT_SIDEBAR.name)}
          <!-- hide button when sidebar docked -->
          <TunnelOut tunnel={tunnels.DefaultSidebarTriggerTunnel} />
        {/if}
        {#if shouldShowStats}
          <Stats
            {app}
            onClose={() => {
              ctx.actionManager.executeAction(actionToggleStats);
            }}
            {renderCustomStats}
          />
        {/if}
      </div>
    </div>
  </FixedSideContainer>
{/snippet}

<!-- ------------------------- tunneled UI ---------------------------- -->
<!-- make sure we render host app components first so that we can detect
     them first on initial render to optimize layout shift -->
{@render children?.()}
<!-- Fallback entry points are the default UI. Host components above keep
     rendering into the outlets below even when defaults are disabled. -->
{#if defaultUIEnabled}
  <MainMenu __fallback>
    <LoadScene />
    <SaveToActiveFile />
    <!-- FIXME we should to test for this inside the item itself -->
    {#if UIOptions.canvasActions.export}
      <Export />
    {/if}
    <!-- FIXME we should to test for this inside the item itself -->
    {#if UIOptions.canvasActions.saveAsImage}
      <SaveAsImage />
    {/if}
    <SearchMenu />
    <Help />
    <ClearCanvas />
    <MainMenuSeparator />
    <MainMenuGroup title="svelte-draw links">
      <Socials />
    </MainMenuGroup>
    <MainMenuSeparator />
    <ToggleTheme allowSystemTheme={false} />
    <ChangeCanvasBackground />
  </MainMenu>
  <DefaultSidebarTrigger
    __fallback
    icon={sidebarRightIcon}
    title={capitalizeString(t("toolBar.library"))}
    onToggle={(open: boolean) => {
      if (open) {
        trackEvent(
          "sidebar",
          `${DEFAULT_SIDEBAR.name} (open)`,
          `button (${editorInterface.formFactor === "phone" ? "mobile" : "desktop"})`,
        );
      }
    }}
    tab={DEFAULT_SIDEBAR.defaultTab}
  />
{/if}
<!-- Keep supporting surfaces available to host-supplied UI, including
     MainMenu.DefaultItems. -->
<OverwriteConfirmDialog __fallback>
  <SaveToDisk />
  <ExportToImage />
</OverwriteConfirmDialog>
{#if appState.openDialog?.name === "ttd"}
  <TTDDialog __fallback />
{/if}
<!-- ------------------------------------------------------------------ -->

{#if defaultUIEnabled && appState.isLoading}
  <LoadingMessage delay={250} />
{/if}
{#if defaultUIEnabled && appState.errorMessage}
  <ErrorDialog
    content={appState.errorMessage}
    onClose={() => ctx.setAppState({ errorMessage: null })}
  />
{/if}
{#if defaultUIEnabled && eyeDropperState && editorInterface.formFactor !== "phone"}
  <EyeDropper
    colorPickerType={eyeDropperState.colorPickerType}
    onCancel={() => {
      eyeDropper.current = null;
    }}
    onChange={onEyeDropperChange}
    onSelect={(color: string, event: PointerEvent) => {
      // read before the write: `eyeDropperState` is derived and would already
      // be null afterwards (React's closure kept the pre-update value)
      const state = eyeDropper.current;
      eyeDropper.current = state?.keepOpenOnAlt && event.altKey ? state : null;
      state?.onSelect?.(color, event);
    }}
  />
{/if}
{#if appState.openDialog?.name === "help"}
  <HelpDialog onClose={() => ctx.setAppState({ openDialog: null })} />
{/if}
<ActiveConfirmDialog />
{#if defaultUIEnabled && appState.openDialog?.name === "elementLinkSelector"}
  <ElementLinkDialog
    sourceElementId={appState.openDialog.sourceElementId}
    onClose={() => ctx.setAppState({ openDialog: null })}
    scene={app.scene}
    {appState}
    generateLinkForSelection={ctx.props.generateLinkForSelection}
  />
{/if}
<TunnelOut tunnel={tunnels.OverwriteConfirmDialogTunnel} />
{@render renderImageExportDialog()}
{@render renderJSONExportDialog()}
{#if defaultUIEnabled && appState.openDialog?.name === "charts"}
  <PasteChartDialog
    data={appState.openDialog.data}
    rawText={appState.openDialog.rawText}
    onClose={() => ctx.setAppState({ openDialog: null })}
  />
{/if}
{#if editorInterface.formFactor === "phone"}
  <MobileMenu
    {onPenModeToggle}
    {renderTopLeftUI}
    {renderTopRightUI}
    {renderSidebars}
    {renderWelcomeScreen}
    {defaultUIEnabled}
    {scrollBackToContentUIEnabled}
  />
{:else}
  {#if ctx.props.viewportStatusFrame?.border}
    <!-- flush against the sidebar's own visible edge, not just the
         --right-sidebar-width column it reserves (which includes the
         sidebar's own outer margin) -->
    <ViewportStatusBorder
      border={ctx.props.viewportStatusFrame.border}
      style={isSidebarDockedAndFits
        ? "right: calc(var(--right-sidebar-width) - var(--space-factor) * 2);"
        : undefined}
    />
  {/if}
  <div
    class="layer-ui__wrapper"
    style={isSidebarDockedAndFits
      ? "width: calc(100% - var(--right-sidebar-width));"
      : undefined}
  >
    {#if renderWelcomeScreen}
      <TunnelOut tunnel={tunnels.WelcomeScreenCenterTunnel} />
    {/if}
    {@render fixedSideContainer()}
    <Footer
      {appState}
      actionManager={ctx.actionManager}
      {showExitZenModeBtn}
      {renderWelcomeScreen}
      {defaultUIEnabled}
      {zoomUIEnabled}
    />
    {#if appState.toast || (scrollBackToContentUIEnabled && appState.scrolledOutside) || ctx.props.viewportStatusFrame?.label}
      <div class="floating-status-stack">
        {#if appState.toast}
          <Toast
            message={appState.toast.message}
            onClose={() => ctx.setAppState({ toast: null })}
            duration={appState.toast.duration}
            closable={appState.toast.closable}
          />
        {/if}
        {#if !appState.toast && scrollBackToContentUIEnabled && appState.scrolledOutside}
          <button
            type="button"
            class="scroll-back-to-content"
            onclick={() => {
              ctx.setAppState((appState) => ({
                ...getScrollToContentState(elements, appState),
              }));
            }}
          >
            {t("buttons.scrollBackToContent")}
          </button>
        {/if}
        {#if ctx.props.viewportStatusFrame?.label}
          <ViewportStatusBadge
            label={ctx.props.viewportStatusFrame.label}
            border={ctx.props.viewportStatusFrame.border}
          />
        {/if}
      </div>
    {/if}
  </div>
  {@render renderSidebars()}
{/if}
