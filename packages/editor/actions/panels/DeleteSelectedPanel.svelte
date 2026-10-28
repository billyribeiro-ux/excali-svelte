<script lang="ts">
  import { MOBILE_ACTION_BUTTON_BG, deriveStylesPanelMode } from "@svelte-draw/common";
  import { getNonDeletedElements } from "@svelte-draw/element";

  import IconButton from "../../components/IconButton.svelte";
  import { TrashIcon } from "../../components/icons";
  import { t } from "../../i18n";
  import { isSomeElementSelected } from "../../scene";
  import { getEditorContext } from "../../ui/editorContext";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData }: ActionPanelProps = $props();

  const ctx = getEditorContext();
  const isMobile = $derived(
    deriveStylesPanelMode(ctx.editorInterface) === "mobile",
  );
</script>

<IconButton
  type="button"
  icon={TrashIcon}
  title={t("labels.delete")}
  aria-label={t("labels.delete")}
  onclick={() => updateData(null)}
  disabled={!isSomeElementSelected(getNonDeletedElements(elements), appState)}
  style={isMobile && appState.openPopup !== "compactOtherProperties"
    ? `background: ${MOBILE_ACTION_BUTTON_BG.background}`
    : undefined}
/>
