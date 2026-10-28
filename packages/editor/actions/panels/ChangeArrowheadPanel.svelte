<script lang="ts">
  import { getArrowheadForPicker, isLinearElement } from "@svelte-draw/element";

  import IconPicker from "../../components/IconPicker.svelte";
  import { getLanguage, t } from "../../i18n";
  import { canHaveArrowheads } from "../../scene";

  import { getArrowheadOptions } from "./arrowheadOptions";
  import { getFormValue } from "./propertiesHelpers";

  import type { Arrowhead } from "@svelte-draw/element/types";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const isRTL = $derived(!!getLanguage().rtl);
  const startArrowheadOptions = $derived(getArrowheadOptions(!isRTL));
  const endArrowheadOptions = $derived(getArrowheadOptions(isRTL));

  const startValue = $derived(
    getFormValue<Arrowhead | null>(
      elements,
      app,
      (element) =>
        isLinearElement(element) && canHaveArrowheads(element.type)
          ? getArrowheadForPicker(element.startArrowhead)
          : appState.currentItemStartArrowhead,
      true,
      (hasSelection) =>
        hasSelection ? null : appState.currentItemStartArrowhead,
    ),
  );
  const endValue = $derived(
    getFormValue<Arrowhead | null>(
      elements,
      app,
      (element) =>
        isLinearElement(element) && canHaveArrowheads(element.type)
          ? getArrowheadForPicker(element.endArrowhead)
          : appState.currentItemEndArrowhead,
      true,
      (hasSelection) => (hasSelection ? null : appState.currentItemEndArrowhead),
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.arrowheads")}</legend>
  <div class="iconSelectList buttonList">
    <IconPicker
      visibleSections={startArrowheadOptions.visibleSections}
      hiddenSections={startArrowheadOptions.hiddenSections}
      label="arrowhead_start"
      value={startValue}
      onChange={(value: Arrowhead | null) =>
        updateData({ position: "start", type: value })}
    />
    <IconPicker
      visibleSections={endArrowheadOptions.visibleSections}
      hiddenSections={endArrowheadOptions.hiddenSections}
      label="arrowhead_end"
      value={endValue}
      onChange={(value: Arrowhead | null) =>
        updateData({ position: "end", type: value })}
    />
  </div>
</fieldset>
