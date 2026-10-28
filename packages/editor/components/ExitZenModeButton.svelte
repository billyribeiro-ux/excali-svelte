<script lang="ts">
  import { actionToggleZenMode } from "../actions";
  import { t } from "../i18n";

  import "./Actions.scss";

  import type { ActionManager } from "../actions/manager";

  let {
    actionManager,
    showExitZenModeBtn,
  }: { actionManager: ActionManager; showExitZenModeBtn: boolean } = $props();
</script>

<button
  type="button"
  class={["disable-zen-mode", { "disable-zen-mode--visible": showExitZenModeBtn }]}
  onclick={() => actionManager.executeAction(actionToggleZenMode)}
>
  {t("buttons.exitZenMode")}
</button>
