<script lang="ts">
  import IconButton from "../../components/IconButton.svelte";
  import Tooltip from "../../components/Tooltip.svelte";
  import { t } from "../../i18n";

  import { getEditorContext } from "../../ui/editorContext";

  import type { ActionPanelProps } from "../types";

  let { updateData }: ActionPanelProps = $props();

  // UIAppState omits zoom; read it from the live editor state
  const ctx = getEditorContext();

  const zoomValue = $derived(ctx.appState.zoom.value);
</script>

<Tooltip
  label={t("buttons.resetZoom")}
  style="height: 100%"
  class="reset-zoom-button-wrapper"
  delay
>
  <IconButton
    type="button"
    class="reset-zoom-button zoom-button"
    aria-label={t("buttons.resetZoom")}
    onclick={() => {
      updateData(null);
    }}
  >
    {(zoomValue * 100).toFixed(0)}%
  </IconButton>
</Tooltip>
