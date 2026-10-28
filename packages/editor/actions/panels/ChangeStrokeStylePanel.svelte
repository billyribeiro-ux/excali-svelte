<script lang="ts">
  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    StrokeStyleDashedIcon,
    StrokeStyleDottedIcon,
    StrokeWidthBaseIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";

  import { getFormValue } from "./propertiesHelpers";

  import type { ExcalidrawElement } from "@svelte-draw/element/types";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) => element.strokeStyle,
      (element) => element.hasOwnProperty("strokeStyle"),
      (hasSelection) => (hasSelection ? null : appState.currentItemStrokeStyle),
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.strokeStyle")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="strokeStyle"
      options={[
        {
          value: "solid",
          text: t("labels.strokeStyle_solid"),
          icon: StrokeWidthBaseIcon,
        },
        {
          value: "dashed",
          text: t("labels.strokeStyle_dashed"),
          icon: StrokeStyleDashedIcon,
        },
        {
          value: "dotted",
          text: t("labels.strokeStyle_dotted"),
          icon: StrokeStyleDottedIcon,
        },
      ]}
      {value}
      onChange={(value: ExcalidrawElement["strokeStyle"]) => updateData(value)}
    />
  </div>
</fieldset>
