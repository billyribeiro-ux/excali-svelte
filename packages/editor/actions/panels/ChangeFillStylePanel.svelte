<script lang="ts">
  import { hasFillStyle } from "@svelte-draw/element";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    FillCrossHatchIcon,
    FillHachureIcon,
    FillSolidIcon,
    FillZigZagIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";
  import { getSelectedElements } from "../../scene";
  import { getShortcutKey } from "../../shortcut";

  import { getFormValue } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const selectedFillStyleElements = $derived(
    getSelectedElements(elements, appState).filter((element) =>
      hasFillStyle(element.type),
    ),
  );
  const allElementsZigZag = $derived(
    selectedFillStyleElements.length > 0 &&
      selectedFillStyleElements.every((el) => el.fillStyle === "zigzag"),
  );
  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) => element.fillStyle,
      (element) => hasFillStyle(element.type),
      (hasSelection) => (hasSelection ? null : appState.currentItemFillStyle),
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.fill")}</legend>
  <div class="buttonList">
    <RadioSelection
      type="button"
      options={[
        {
          value: "hachure",
          text: `${
            allElementsZigZag ? t("labels.zigzag") : t("labels.hachure")
          } (${getShortcutKey("Alt-Click")})`,
          icon: allElementsZigZag ? FillZigZagIcon : FillHachureIcon,
          active: allElementsZigZag ? true : undefined,
          testId: `fill-hachure`,
        },
        {
          value: "cross-hatch",
          text: t("labels.crossHatch"),
          icon: FillCrossHatchIcon,
          testId: `fill-cross-hatch`,
        },
        {
          value: "solid",
          text: t("labels.solid"),
          icon: FillSolidIcon,
          testId: `fill-solid`,
        },
      ]}
      {value}
      onClick={(value: string, event: MouseEvent) => {
        const nextValue =
          event.altKey &&
          value === "hachure" &&
          selectedFillStyleElements.every((el) => el.fillStyle === "hachure")
            ? "zigzag"
            : value;

        updateData(nextValue);
      }}
    />
  </div>
</fieldset>
