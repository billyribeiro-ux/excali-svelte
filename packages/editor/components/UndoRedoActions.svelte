<script lang="ts">
  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";

  import "./Actions.scss";
  import Tooltip from "./Tooltip.svelte";

  let { class: className }: { class?: string } = $props();
</script>

<!-- the React original interpolates `className` unconditionally -->
<div class={`undo-redo-buttons ${className}`}>
  <div class="undo-button-container">
    <Tooltip label={t("buttons.undo")} delay>
      <ActionPanel name="undo" />
    </Tooltip>
  </div>
  <div class="redo-button-container">
    <Tooltip label={t("buttons.redo")} delay>
      <ActionPanel name="redo" />
    </Tooltip>
  </div>
</div>
