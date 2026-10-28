<script lang="ts">
  import type {
    NonDeletedElementsMap,
    NonDeletedSceneElementsMap,
  } from "@svelte-draw/element/types";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import { getTargetElements } from "../scene";

  import "./Actions.scss";

  import CombinedArrowProperties from "./CombinedArrowProperties.svelte";
  import CombinedExtraActions from "./CombinedExtraActions.svelte";
  import CombinedShapeProperties from "./CombinedShapeProperties.svelte";
  import CombinedTextProperties from "./CombinedTextProperties.svelte";
  import Island from "./Island.svelte";
  import LinearEditorAction from "./LinearEditorAction.svelte";
  import { getShapeActionPredicates } from "./shapeActionPredicates";

  import type { AppClassProperties, UIAppState } from "../types";

  // Mobile styles panel — the horizontal action bar used on phones, with an
  // overflow measurement that promotes duplicate/delete out of the popover when
  // there is room.
  let {
    appState,
    elementsMap,
    app,
  }: {
    appState: UIAppState;
    elementsMap: NonDeletedElementsMap | NonDeletedSceneElementsMap;
    app: AppClassProperties;
  } = $props();

  const targetElements = $derived(getTargetElements(elementsMap, appState));
  const predicates = $derived(
    getShapeActionPredicates(appState, targetElements, elementsMap, app),
  );

  let mobileActions = $state<HTMLDivElement | null>(null);
  let actionsWidth = $state(0);

  // measure on mount, on every resize, and whenever the panel's inputs change
  // (the React version measured on each render)
  $effect(() => {
    void appState;
    void predicates;
    const el = mobileActions;
    if (!el) {
      return;
    }
    actionsWidth = el.getBoundingClientRect()?.width ?? 0;
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      actionsWidth = el.getBoundingClientRect()?.width ?? 0;
    });
    observer.observe(el);
    return () => observer.disconnect();
  });

  // 7 actions + 2 for undo/redo
  const MIN_ACTIONS = 9;

  const GAP = 6;
  const WIDTH = 32;

  const MIN_WIDTH = MIN_ACTIONS * WIDTH + (MIN_ACTIONS - 1) * GAP;

  const ADDITIONAL_WIDTH = WIDTH + GAP;

  const showDeleteOutside = $derived(
    actionsWidth >= MIN_WIDTH + ADDITIONAL_WIDTH,
  );
  const showDuplicateOutside = $derived(
    actionsWidth >= MIN_WIDTH + 2 * ADDITIONAL_WIDTH,
  );
</script>

<Island
  class="compact-shape-actions mobile-shape-actions"
  style="flex-direction: row; box-shadow: none; padding: 0; z-index: 2; background-color: transparent; height: {WIDTH *
    1.35}px; margin-bottom: 4px; align-items: center; gap: {GAP}px; pointer-events: none;"
  bind:element={mobileActions}
>
  <div style="display: flex; flex-direction: row; gap: {GAP}px; flex: 1;">
    {#if predicates.strokeColor}
      <div class="compact-action-item">
        <ActionPanel name="changeStrokeColor" />
      </div>
    {/if}
    <!-- Background Color (the bucket fill variant excludes `transparent`) -->
    {#if predicates.backgroundColor}
      <div class="compact-action-item">
        <ActionPanel
          name={appState.activeTool.type === "bucketfill"
            ? "changeBucketFillBackgroundColor"
            : "changeBackgroundColor"}
        />
      </div>
    {/if}
    <CombinedShapeProperties {appState} {predicates} />
    <!-- Combined Arrow Properties -->
    <CombinedArrowProperties {appState} {targetElements} {predicates} {app} />
    <!-- Linear Editor -->
    <LinearEditorAction {predicates} />
    <!-- Text Properties -->
    {#if predicates.text}
      <div class="compact-action-item">
        <ActionPanel name="changeFontFamily" />
      </div>
      <CombinedTextProperties {appState} {predicates} />
    {/if}

    <!-- Combined Other Actions -->
    <CombinedExtraActions
      {appState}
      {predicates}
      showDuplicate={!showDuplicateOutside}
      showDelete={!showDeleteOutside}
    />
  </div>
  <div style="display: flex; flex-direction: row; gap: {GAP}px;">
    <div class="compact-action-item"><ActionPanel name="undo" /></div>
    <div class="compact-action-item"><ActionPanel name="redo" /></div>
    {#if showDuplicateOutside}
      <div class="compact-action-item">
        <ActionPanel name="duplicateSelection" />
      </div>
    {/if}
    {#if showDeleteOutside}
      <div class="compact-action-item">
        <ActionPanel name="deleteSelectedElements" />
      </div>
    {/if}
  </div>
</Island>
