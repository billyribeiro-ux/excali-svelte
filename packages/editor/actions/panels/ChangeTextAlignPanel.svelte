<script lang="ts">
  import { getBoundTextElement, isTextElement } from "@svelte-draw/element";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    TextAlignCenterIcon,
    TextAlignLeftIcon,
    TextAlignRightIcon,
  } from "../../components/icons";
  import { withCaretPositionPreservation } from "../../hooks/textEditorFocus.svelte";
  import { t } from "../../i18n";

  import { getFormValue, getStylesPanelInfo } from "./propertiesHelpers";

  import type { TextAlign } from "@svelte-draw/element/types";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app, data }: ActionPanelProps =
    $props();

  const isCompact = $derived(getStylesPanelInfo(app).isCompact);

  const value = $derived.by(() => {
    const elementsMap = app.scene.getNonDeletedElementsMap();
    return getFormValue(
      elements,
      app,
      (element) => {
        if (isTextElement(element)) {
          return element.textAlign;
        }
        const boundTextElement = getBoundTextElement(element, elementsMap);
        if (boundTextElement) {
          return boundTextElement.textAlign;
        }
        return null;
      },
      (element) =>
        isTextElement(element) ||
        getBoundTextElement(element, elementsMap) !== null,
      (hasSelection) => (hasSelection ? null : appState.currentItemTextAlign),
    );
  });
</script>

<fieldset>
  <legend>{t("labels.textAlign")}</legend>
  <div class="buttonList">
    <RadioSelection
      group="text-align"
      options={[
        {
          value: "left",
          text: t("labels.left"),
          icon: TextAlignLeftIcon,
          testId: "align-left",
        },
        {
          value: "center",
          text: t("labels.center"),
          icon: TextAlignCenterIcon,
          testId: "align-horizontal-center",
        },
        {
          value: "right",
          text: t("labels.right"),
          icon: TextAlignRightIcon,
          testId: "align-right",
        },
      ]}
      {value}
      onChange={(value: TextAlign | false) => {
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
