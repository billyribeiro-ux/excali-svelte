<script lang="ts">
  import { getColorTargetElement } from "@svelte-draw/element";

  import ColorPicker from "../../components/ColorPicker/ColorPicker.svelte";
  import { t } from "../../i18n";
  import { resolveColorTarget } from "../colorTargets";

  import { getFormValue, getStylesPanelInfo } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const stylesPanelMode = $derived(getStylesPanelInfo(app).stylesPanelMode);
  const target = $derived(
    resolveColorTarget(appState, elements, "backgroundColor"),
  );
  // while editing a note's label the picker shows and sets the note's fill
  const color = $derived.by(() => {
    const elementsMap = app.scene.getNonDeletedElementsMap();
    return getFormValue(
      elements,
      app,
      (element) =>
        getColorTargetElement(element, "backgroundColor", elementsMap)
          .backgroundColor,
      true,
      (hasSelection) => (!hasSelection ? target.currentValue : null),
    );
  });
</script>

{#if stylesPanelMode === "full"}
  <!-- svelte-ignore a11y_hidden -->
  <h3 aria-hidden="true">{t("labels.background")}</h3>
{/if}
<ColorPicker
  topPicks={target.topPicks}
  palette={target.palette}
  customizableTopPicks={target.customizableTopPicks}
  excludedColors={target.excludedColors}
  type="elementBackground"
  label={t("labels.background")}
  {color}
  onChange={(color: string) => updateData({ color })}
  {elements}
  {appState}
  {updateData}
/>
