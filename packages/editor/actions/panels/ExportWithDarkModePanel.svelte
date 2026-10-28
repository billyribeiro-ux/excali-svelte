<script lang="ts">
  import { THEME } from "@svelte-draw/common";

  import type { Theme } from "@svelte-draw/element/types";

  import DarkModeToggle from "../../components/DarkModeToggle.svelte";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { appState, updateData }: ActionPanelProps = $props();
</script>

<div
  style="display: flex; justify-content: flex-end; margin-top: -45px; margin-bottom: 10px;"
>
  <DarkModeToggle
    value={appState.exportWithDarkMode ? THEME.DARK : THEME.LIGHT}
    onChange={(theme: Theme) => {
      updateData(theme === THEME.DARK);
    }}
    title={t("imageExportDialog.label.darkMode")}
  />
</div>
