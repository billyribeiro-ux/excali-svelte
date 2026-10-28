<script lang="ts">
  import { ROUNDNESS } from "@svelte-draw/common";

  import { getNonDeletedElements, isArrowElement } from "@svelte-draw/element";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import { EdgeRoundIcon, EdgeSharpIcon } from "../../components/icons";
  import { t } from "../../i18n";
  import { getTargetElements } from "../../scene";
  import ActionPanel from "../ActionPanel.svelte";

  import { getFormValue } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const hasLegacyRoundness = $derived(
    getTargetElements(getNonDeletedElements(elements), appState).some(
      (el) => el.roundness?.type === ROUNDNESS.LEGACY,
    ),
  );
  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) =>
        hasLegacyRoundness ? null : element.roundness ? "round" : "sharp",
      (element) =>
        !isArrowElement(element) && element.hasOwnProperty("roundness"),
      (hasSelection) => (hasSelection ? null : appState.currentItemRoundness),
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.edges")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="edges"
      options={[
        { value: "sharp", text: t("labels.sharp"), icon: EdgeSharpIcon },
        { value: "round", text: t("labels.round"), icon: EdgeRoundIcon },
      ]}
      {value}
      onChange={(value: "sharp" | "round") => updateData(value)}
    />
    <ActionPanel name="togglePolygon" />
  </div>
</fieldset>
