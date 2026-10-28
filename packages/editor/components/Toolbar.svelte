<script lang="ts">
  import type { Snippet } from "svelte";

  import { deriveStylesPanelMode } from "@svelte-draw/common";

  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import ArrowToolButton from "./ArrowToolButton.svelte";
  import DiamondToolButton from "./DiamondToolButton.svelte";
  import EllipseToolButton from "./EllipseToolButton.svelte";
  import EraserToolButton from "./EraserToolButton.svelte";
  import ExtraToolsDropdown from "./ExtraToolsDropdown.svelte";
  import FreedrawToolButton from "./FreedrawToolButton.svelte";
  import FreedrawToolPopover from "./FreedrawToolPopover.svelte";
  import HandToolButton from "./HandToolButton.svelte";
  import HintViewer from "./HintViewer.svelte";
  import Island from "./Island.svelte";
  import LassoToolButton from "./LassoToolButton.svelte";
  import LineToolButton from "./LineToolButton.svelte";
  import LockButton from "./LockButton.svelte";
  import PenModeButton from "./PenModeButton.svelte";
  import RectangleToolButton from "./RectangleToolButton.svelte";
  import SelectionToolButton from "./SelectionToolButton.svelte";
  import SelectionToolPopover from "./SelectionToolPopover.svelte";
  import StackRow from "./StackRow.svelte";
  import StickyNoteToolButton from "./StickyNoteToolButton.svelte";
  import TextToolButton from "./TextToolButton.svelte";

  import type { AppClassProperties, AppProps, UIAppState } from "../types";

  // the main (desktop/tablet) toolbar island
  let {
    app,
    appState,
    UIOptions,
    setAppState: setAppStateProp,
    onPenModeToggle,
    onLockToggle,
    heading,
  }: {
    app: AppClassProperties;
    appState: UIAppState;
    UIOptions: AppProps["UIOptions"];
    /** optional override of the editor context's `setAppState` */
    setAppState?: AppClassProperties["setAppState"];
    onPenModeToggle: AppClassProperties["togglePenMode"];
    onLockToggle: () => void;
    heading?: Snippet;
  } = $props();

  const ctx = getEditorContext();

  const setAppState = $derived(setAppStateProp ?? ctx.setAppState);
  const editorInterface = $derived(ctx.editorInterface);
  const isCompactStylesPanel = $derived(
    deriveStylesPanelMode(editorInterface) === "compact",
  );

  const activeTool = $derived(appState.activeTool);
  const gap = $derived(isCompactStylesPanel ? 0.5 : 1);
</script>

<Island
  padding={1}
  class={[
    "App-toolbar",
    {
      "zen-mode": appState.zenModeEnabled,
      "App-toolbar--compact": isCompactStylesPanel,
    },
  ]}
  data-viewport-ui="top"
>
  <HintViewer
    {appState}
    isMobile={editorInterface.formFactor === "phone"}
    {editorInterface}
    {app}
  />
  {@render heading?.()}
  <StackRow {gap}>
    <!-- in compact UI the pen mode button is rendered as a separate
         floating button below the compact actions menu -->
    {#if !isCompactStylesPanel}
      <PenModeButton
        checked={appState.penMode}
        onChange={() => onPenModeToggle(null)}
        title={t("toolBar.penMode")}
        penDetected={appState.penDetected}
      />
    {/if}
    {#if app.props.activeTool == null}
      <LockButton
        checked={appState.activeTool.locked}
        onChange={onLockToggle}
        title={t("toolBar.lock")}
        disabled={app.props.activeTool != null}
      />

      <div class="App-toolbar__divider" style="margin-right: 0.25rem;"></div>
    {/if}

    <HandToolButton {app} {activeTool} hideKeyBinding />
    {#if isCompactStylesPanel}
      <SelectionToolPopover {app} {activeTool} />
    {:else if appState.preferredSelectionTool.type === "lasso"}
      <LassoToolButton {app} {activeTool} />
    {:else}
      <SelectionToolButton {app} {activeTool} />
    {/if}
    <RectangleToolButton {app} {activeTool} />
    <DiamondToolButton {app} {activeTool} />
    <EllipseToolButton {app} {activeTool} />
    <ArrowToolButton {app} {activeTool} />
    <LineToolButton {app} {activeTool} />
    {#if isCompactStylesPanel}
      <FreedrawToolPopover {app} {activeTool} />
    {:else}
      <FreedrawToolButton {app} {activeTool} />
    {/if}
    <TextToolButton {app} {activeTool} />
    <StickyNoteToolButton {app} {activeTool} />
    <EraserToolButton {app} {activeTool} />

    <div class="App-toolbar__divider" style="margin-left: 0.25rem;"></div>

    <ExtraToolsDropdown {app} {activeTool} {UIOptions} {setAppState} />
  </StackRow>
</Island>
