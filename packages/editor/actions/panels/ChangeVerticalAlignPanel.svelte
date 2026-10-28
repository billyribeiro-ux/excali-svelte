<script lang="ts">
  import { VERTICAL_ALIGN } from "@svelte-draw/common";

  import { getBoundTextElement, isTextElement } from "@svelte-draw/element";

  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    TextAlignBottomIcon,
    TextAlignMiddleIcon,
    TextAlignTopIcon,
  } from "../../components/icons";
  import { withCaretPositionPreservation } from "../../hooks/textEditorFocus.svelte";
  import { t } from "../../i18n";

  import { getFormValue, getStylesPanelInfo } from "./propertiesHelpers";
  import { resolveIcon } from "./propertiesIcons";

  import type { VerticalAlign } from "@svelte-draw/element/types";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app, data }: ActionPanelProps =
    $props();

  const isCompact = $derived(getStylesPanelInfo(app).isCompact);

  const value = $derived(
    getFormValue(
      elements,
      app,
      (element) => {
        if (isTextElement(element) && element.containerId) {
          return element.verticalAlign;
        }
        const boundTextElement = getBoundTextElement(
          element,
          app.scene.getNonDeletedElementsMap(),
        );
        if (boundTextElement) {
          return boundTextElement.verticalAlign;
        }
        return null;
      },
      (element) =>
        isTextElement(element) ||
        getBoundTextElement(element, app.scene.getNonDeletedElementsMap()) !==
          null,
      (hasSelection) => (hasSelection ? null : VERTICAL_ALIGN.MIDDLE),
    ),
  );
</script>

<fieldset>
  <div class="buttonList">
    <RadioSelection
      group="text-align"
      options={[
        {
          value: VERTICAL_ALIGN.TOP,
          text: t("labels.alignTop"),
          icon: resolveIcon(TextAlignTopIcon, { theme: appState.theme }),
          testId: "align-top",
        },
        {
          value: VERTICAL_ALIGN.MIDDLE,
          text: t("labels.centerVertically"),
          icon: resolveIcon(TextAlignMiddleIcon, { theme: appState.theme }),
          testId: "align-middle",
        },
        {
          value: VERTICAL_ALIGN.BOTTOM,
          text: t("labels.alignBottom"),
          icon: resolveIcon(TextAlignBottomIcon, { theme: appState.theme }),
          testId: "align-bottom",
        },
      ]}
      {value}
      onChange={(value: VerticalAlign | false) => {
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
