<script lang="ts">
  import CheckboxItem from "../../components/CheckboxItem.svelte";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { appState, updateData }: ActionPanelProps = $props();
</script>

<CheckboxItem
  checked={appState.exportBackground}
  onChange={(checked: boolean) => updateData(checked)}
>
  {t("imageExportDialog.label.withBackground")}
</CheckboxItem>
