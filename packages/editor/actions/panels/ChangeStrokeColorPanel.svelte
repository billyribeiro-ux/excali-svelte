<script lang="ts">
  import ColorPicker from "../../components/ColorPicker/ColorPicker.svelte";
  import { t } from "../../i18n";
  import { resolveColorTarget } from "../colorTargets";

  import { getFormValue, getStylesPanelInfo } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const stylesPanelMode = $derived(getStylesPanelInfo(app).stylesPanelMode);
  const target = $derived(
    resolveColorTarget(appState, elements, "strokeColor"),
  );
  // a note has no stroke: its "stroke" is the ink of its text and footer
  const label = $derived(
    target.kind === "sticky" ? t("labels.textColor") : t("labels.stroke"),
  );
  const color = $derived(
    getFormValue(
      elements,
      app,
      (element) => element.strokeColor,
      true,
      (hasSelection) => (!hasSelection ? target.currentValue : null),
    ),
  );
</script>

{#if stylesPanelMode === "full"}
  <!-- svelte-ignore a11y_hidden -->
  <h3 aria-hidden="true">{label}</h3>
{/if}
<ColorPicker
  topPicks={target.topPicks}
  palette={target.palette}
  customizableTopPicks={target.customizableTopPicks}
  excludedColors={target.excludedColors}
  type="elementStroke"
  {label}
  {color}
  onChange={(color: string) => updateData({ color })}
  {elements}
  {appState}
  {updateData}
/>
