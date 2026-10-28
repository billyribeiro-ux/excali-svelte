<script lang="ts">
  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    SloppinessArchitectIcon,
    SloppinessArtistIcon,
    SloppinessCartoonistIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";

  import { getFormValue } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) => element.roughness,
      (element) => element.hasOwnProperty("roughness"),
      (hasSelection) => (hasSelection ? null : appState.currentItemRoughness),
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.sloppiness")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="sloppiness"
      options={[
        {
          value: 0,
          text: t("labels.architect"),
          icon: SloppinessArchitectIcon,
        },
        {
          value: 1,
          text: t("labels.artist"),
          icon: SloppinessArtistIcon,
        },
        {
          value: 2,
          text: t("labels.cartoonist"),
          icon: SloppinessCartoonistIcon,
        },
      ]}
      {value}
      onChange={(value: number) => updateData(value)}
    />
  </div>
</fieldset>
