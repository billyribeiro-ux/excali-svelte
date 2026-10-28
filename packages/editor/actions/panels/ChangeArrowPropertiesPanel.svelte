<script lang="ts">
  import ActionPanel from "../ActionPanel.svelte";

  import type { ActionPanelProps } from "../types";

  // this action only groups the arrow type and arrowhead panels
  const _props: ActionPanelProps = $props();
</script>

<div class="selected-shape-actions">
  <ActionPanel name="changeArrowhead" />
  <ActionPanel name="changeArrowType" />
</div>
