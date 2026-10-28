<script lang="ts">
  import type {
    NonDeletedElementsMap,
    NonDeletedSceneElementsMap,
  } from "@svelte-draw/element/types";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";
  import { getTargetElements } from "../scene";

  import "./Actions.scss";

  import AlignFieldset from "./AlignFieldset.svelte";
  import LayersFieldset from "./LayersFieldset.svelte";
  import { getShapeActionPredicates } from "./shapeActionPredicates";

  import type { AppClassProperties, UIAppState } from "../types";

  // Full styles panel: the wide, always-expanded layout used on desktop when
  // the UI is in "full" mode.
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

{#if appState.activeTool.type === "bucketfill"}
  <!-- the bucket fill tool configures only the fill it creates: color, fill
       style, and opacity (shared `currentItem*` values; no stroke properties) -->
  <div class="selected-shape-actions">
    <div><ActionPanel name="changeBucketFillBackgroundColor" /></div>
    <ActionPanel name="changeFillStyle" />
    <ActionPanel name="changeOpacity" />
  </div>
{:else}
  <div class="selected-shape-actions">
    <div>
      {#if predicates.strokeColor}<ActionPanel name="changeStrokeColor" />{/if}
    </div>
    {#if predicates.backgroundColor}
      <div><ActionPanel name="changeBackgroundColor" /></div>
    {/if}
    {#if predicates.fill}<ActionPanel name="changeFillStyle" />{/if}

    {#if predicates.strokeWidth}<ActionPanel name="changeStrokeWidth" />{/if}

    {#if predicates.strokeStyle}<ActionPanel name="changeStrokeStyle" />{/if}

    {#if predicates.freedrawMode}<ActionPanel name="changeFreedrawMode" />{/if}

    {#if predicates.sloppiness}<ActionPanel name="changeSloppiness" />{/if}

    {#if predicates.roundness}<ActionPanel name="changeRoundness" />{/if}

    {#if predicates.arrowType}<ActionPanel name="changeArrowType" />{/if}

    {#if predicates.text}
      <fieldset><ActionPanel name="changeFontFamily" /></fieldset>
      <ActionPanel name="changeFontSize" />
      {#if predicates.textAlign}<ActionPanel name="changeTextAlign" />{/if}
    {/if}

    {#if predicates.verticalAlign}<ActionPanel name="changeVerticalAlign" />{/if}
    {#if predicates.arrowheads}<ActionPanel name="changeArrowhead" />{/if}

    {#if predicates.opacity}<ActionPanel name="changeOpacity" />{/if}

    {#if predicates.layers}<LayersFieldset />{/if}

    {#if predicates.align}
      <AlignFieldset showDistribute={predicates.distribute} />
    {/if}
    {#if predicates.showExtraActions}
      <fieldset>
        <legend>{t("labels.actions")}</legend>
        <div class="buttonList">
          <ActionPanel name="duplicateSelection" />
          <ActionPanel name="deleteSelectedElements" />
          <ActionPanel name="group" />
          <ActionPanel name="ungroup" />
          {#if predicates.link}<ActionPanel name="hyperlink" />{/if}
          {#if predicates.cropEditor}<ActionPanel name="cropEditor" />{/if}
          {#if predicates.lineEditor}<ActionPanel name="toggleLinearEditor" />{/if}
        </div>
      </fieldset>
    {/if}
  </div>
{/if}
