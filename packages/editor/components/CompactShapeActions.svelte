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
  import { getShapeActionPredicates } from "./shapeActionPredicates";

  import type { AppClassProperties, UIAppState } from "../types";

  // Compact styles panel — the collapsed, popover-driven layout used on
  // tablets and on desktop when the UI is in "compact" mode.
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
</script>

<div class="compact-shape-actions">
  <!-- Stroke Color -->
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

  <!-- Freedraw pressure: standalone button cycling the variability mode -->
  {#if predicates.freedrawMode}
    <div class="compact-action-item">
      <ActionPanel name="changeFreedrawMode" data={{ cycle: true }} />
    </div>
  {/if}

  <CombinedShapeProperties {appState} {predicates} />

  <CombinedArrowProperties {appState} {targetElements} {predicates} {app} />

  <!-- Linear Editor -->
  {#if predicates.lineEditor}
    <div class="compact-action-item">
      <ActionPanel name="toggleLinearEditor" />
    </div>
  {/if}

  <!-- Text Properties -->
  {#if predicates.text}
    <div class="compact-action-item">
      <ActionPanel name="changeFontFamily" />
    </div>
    <CombinedTextProperties {appState} {predicates} />
  {/if}

  <!-- Dedicated Copy Button -->
  {#if predicates.showExtraActions}
    <div class="compact-action-item">
      <ActionPanel name="duplicateSelection" />
    </div>
  {/if}

  <!-- Dedicated Delete Button -->
  {#if predicates.showExtraActions}
    <div class="compact-action-item">
      <ActionPanel name="deleteSelectedElements" />
    </div>
  {/if}

  <CombinedExtraActions {appState} {predicates} />
</div>
