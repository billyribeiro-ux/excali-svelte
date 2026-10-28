<script lang="ts">
  import { ARROW_TYPE } from "@svelte-draw/common";

  import { isArrowElement } from "@svelte-draw/element";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    elbowArrowIcon,
    roundArrowIcon,
    sharpArrowIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";

  import { getFormValue } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) => {
        if (isArrowElement(element)) {
          return element.elbowed
            ? ARROW_TYPE.elbow
            : element.roundness
            ? ARROW_TYPE.round
            : ARROW_TYPE.sharp;
        }

        return null;
      },
      (element) => isArrowElement(element),
      (hasSelection) => (hasSelection ? null : appState.currentItemArrowType),
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.arrowtypes")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="arrowtypes"
      options={[
        {
          value: ARROW_TYPE.sharp,
          text: t("labels.arrowtype_sharp"),
          icon: sharpArrowIcon,
          testId: "sharp-arrow",
        },
        {
          value: ARROW_TYPE.round,
          text: t("labels.arrowtype_round"),
          icon: roundArrowIcon,
          testId: "round-arrow",
        },
        {
          value: ARROW_TYPE.elbow,
          text: t("labels.arrowtype_elbowed"),
          icon: elbowArrowIcon,
          testId: "elbow-arrow",
        },
      ]}
      {value}
      onChange={(value: keyof typeof ARROW_TYPE) => updateData(value)}
    />
  </div>
</fieldset>
