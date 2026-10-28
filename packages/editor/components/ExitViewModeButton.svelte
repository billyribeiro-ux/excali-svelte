<script lang="ts">
  import { actionToggleViewMode } from "../actions/actionToggleViewMode";

  import "./Actions.scss";
  import Icon from "./Icon.svelte";
  import { pencilIcon } from "./icons";

  import type { ActionManager } from "../actions/manager";

  let { actionManager }: { actionManager: ActionManager } = $props();
</script>

<button
  type="button"
  class="disable-view-mode"
  onclick={() => actionManager.executeAction(actionToggleViewMode)}
>
  <Icon icon={pencilIcon} />
</button>
