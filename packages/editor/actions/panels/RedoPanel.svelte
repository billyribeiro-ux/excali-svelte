<script lang="ts">
  import HistoryPanel from "./HistoryPanel.svelte";

  import type { ActionPanelProps } from "../types";

  let props: ActionPanelProps = $props();
</script>

<HistoryPanel kind="redo" {...props} />
