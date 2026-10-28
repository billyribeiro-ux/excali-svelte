<script lang="ts">
  import { MAX_ZOOM } from "@svelte-draw/common";

  import IconButton from "../../components/IconButton.svelte";
  import Tooltip from "../../components/Tooltip.svelte";
  import { ZoomInIcon } from "../../components/icons";
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
  label={`${t("buttons.zoomIn")} — ${getShortcutKey("CtrlOrCmd++")}`}
  class="zoom-in-button-wrapper"
  delay
>
  <IconButton
    type="button"
    class="zoom-in-button zoom-button"
    icon={ZoomInIcon}
    aria-label={t("buttons.zoomIn")}
    aria-keyshortcuts={getShortcutKey("CtrlOrCmd++")}
    disabled={zoomValue >= MAX_ZOOM}
    onclick={() => {
      updateData(null);
    }}
  />
</Tooltip>
