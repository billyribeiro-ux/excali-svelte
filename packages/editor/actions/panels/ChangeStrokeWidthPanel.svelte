<script lang="ts">
  import {
    STROKE_WIDTH_KEYS,
    getStrokeWidthByKey,
    type StrokeWidthKey,
  } from "@svelte-draw/common";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    StrokeWidthBaseIcon,
    StrokeWidthBoldIcon,
    StrokeWidthExtraBoldIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";

  import { getFormValue } from "./propertiesHelpers";

  import type { ExcalidrawElement } from "@svelte-draw/element/types";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const getStrokeWidthKeyForElement = (
    element: ExcalidrawElement,
  ): StrokeWidthKey | null =>
    STROKE_WIDTH_KEYS.find(
      (key) => getStrokeWidthByKey(element.type, key) === element.strokeWidth,
    ) ?? null;

  const value = $derived(
    getFormValue(
      elements,
      app,
      getStrokeWidthKeyForElement,
      (element) => element.hasOwnProperty("strokeWidth"),
      (hasSelection) =>
        hasSelection ? null : appState.currentItemStrokeWidthKey,
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.strokeWidth")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="stroke-width"
      options={[
        {
          value: "thin",
          text: t("labels.thin"),
          icon: StrokeWidthBaseIcon,
          testId: "strokeWidth-thin",
        },
        {
          value: "medium",
          text: t("labels.medium"),
          icon: StrokeWidthBoldIcon,
          testId: "strokeWidth-medium",
        },
        {
          value: "bold",
          text: t("labels.bold"),
          icon: StrokeWidthExtraBoldIcon,
          testId: "strokeWidth-bold",
        },
      ]}
      {value}
      onChange={(value: StrokeWidthKey) => updateData(value)}
    />
  </div>
</fieldset>
