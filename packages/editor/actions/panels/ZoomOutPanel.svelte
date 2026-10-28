<script lang="ts">
  import { MIN_ZOOM } from "@svelte-draw/common";

  import IconButton from "../../components/IconButton.svelte";
  import Tooltip from "../../components/Tooltip.svelte";
  import { ZoomOutIcon } from "../../components/icons";
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";

  import { getEditorContext } from "../../ui/editorContext";

  import type { ActionPanelProps } from "../types";

  let { updateData }: ActionPanelProps = $props();

  // UIAppState omits zoom; read it from the live editor state
  const ctx = getEditorContext();

  const zoomValue = $derived(ctx.appState.zoom.value);
</script>

<Tooltip
  label={`${t("buttons.zoomOut")} — ${getShortcutKey("CtrlOrCmd+-")}`}
  class="zoom-out-button-wrapper"
  delay
>
  <IconButton
    type="button"
    class="zoom-out-button zoom-button"
    icon={ZoomOutIcon}
    aria-label={t("buttons.zoomOut")}
    aria-keyshortcuts={getShortcutKey("CtrlOrCmd+-")}
    disabled={zoomValue <= MIN_ZOOM}
    onclick={() => {
      updateData(null);
    }}
  />
</Tooltip>
