<script lang="ts">
  import CheckboxItem from "../../components/CheckboxItem.svelte";
  import Tooltip from "../../components/Tooltip.svelte";
  import { questionCircle } from "../../components/icons";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { appState, updateData }: ActionPanelProps = $props();
</script>

<CheckboxItem
  checked={appState.exportEmbedScene}
  onChange={(checked: boolean) => updateData(checked)}
>
  {t("imageExportDialog.label.embedScene")}
  <Tooltip label={t("imageExportDialog.tooltip.embedScene")} long={true}>
    <div class="excalidraw-tooltip-icon">{@html questionCircle.html}</div>
  </Tooltip>
</CheckboxItem>
