<script lang="ts">
  import {
    BUCKET_FILL_BACKGROUND_PICKS,
    COLOR_PALETTE,
    DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE,
  } from "@svelte-draw/common";

  import ColorPicker from "../../components/ColorPicker/ColorPicker.svelte";
  import { t } from "../../i18n";

  import { getStylesPanelInfo } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const stylesPanelMode = $derived(getStylesPanelInfo(app).stylesPanelMode);
</script>

{#if stylesPanelMode === "full"}
  <!-- svelte-ignore a11y_hidden -->
  <h3 aria-hidden="true">{t("labels.background")}</h3>
{/if}
<!--
  excludedColors: hidden rather than removed from the palette so the remaining
  colors keep their usual hotkeys (w for white etc.).
  customizableTopPicks: customized independently of the background picker's
  picks even though both drive `currentItemBackgroundColor` — the bucket
  strip's defaults and use case differ (no transparent).
-->
<ColorPicker
  topPicks={BUCKET_FILL_BACKGROUND_PICKS}
  palette={DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE}
  excludedColors={[COLOR_PALETTE.transparent]}
  customizableTopPicks="bucketFill"
  type="elementBackground"
  label={t("labels.background")}
  color={app.bucketFill.getBucketFillBackgroundColor(
    appState.currentItemBackgroundColor,
  )}
  onChange={(color: string) =>
    updateData({ currentItemBackgroundColor: color })}
  {elements}
  {appState}
  {updateData}
/>
