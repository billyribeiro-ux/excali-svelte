<script lang="ts">
  import {
    DEFAULT_FONT_SIZE,
    FONT_SIZES,
  } from "@svelte-draw/common";

  import {
    getBaseFontSize,
    getBoundTextElement,
    isTextElement,
  } from "@svelte-draw/element";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    FontSizeExtraLargeIcon,
    FontSizeLargeIcon,
    FontSizeMediumIcon,
    FontSizeSmallIcon,
  } from "../../components/icons";
  import { withCaretPositionPreservation } from "../../hooks/textEditorFocus.svelte";
  import { t } from "../../i18n";

  import { getFormValue, getStylesPanelInfo } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app, data }: ActionPanelProps =
    $props();

  const isCompact = $derived(getStylesPanelInfo(app).isCompact);

  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) => {
        const elementsMap = app.scene.getNonDeletedElementsMap();
        if (isTextElement(element)) {
          return getBaseFontSize(element, elementsMap);
        }
        const boundTextElement = getBoundTextElement(element, elementsMap);
        if (boundTextElement) {
          return getBaseFontSize(boundTextElement, elementsMap);
        }
        return null;
      },
      (element) =>
        isTextElement(element) ||
        getBoundTextElement(element, app.scene.getNonDeletedElementsMap()) !==
          null,
      (hasSelection) =>
        hasSelection ? null : appState.currentItemFontSize || DEFAULT_FONT_SIZE,
    ),
  );
</script>

<fieldset>
  <legend>{t("labels.fontSize")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="font-size"
      options={[
        {
          value: FONT_SIZES.sm,
          text: t("labels.small"),
          icon: FontSizeSmallIcon,
          testId: "fontSize-small",
        },
        {
          value: FONT_SIZES.md,
          text: t("labels.medium"),
          icon: FontSizeMediumIcon,
          testId: "fontSize-medium",
        },
        {
          value: FONT_SIZES.lg,
          text: t("labels.large"),
          icon: FontSizeLargeIcon,
          testId: "fontSize-large",
        },
        {
          value: FONT_SIZES.xl,
          text: t("labels.veryLarge"),
          icon: FontSizeExtraLargeIcon,
          testId: "fontSize-veryLarge",
        },
      ]}
      {value}
      onChange={(value: number) => {
        withCaretPositionPreservation(
          () => updateData(value),
          isCompact,
          !!appState.editingTextElement,
          data?.onPreventClose,
        );
      }}
    />
  </div>
</fieldset>
