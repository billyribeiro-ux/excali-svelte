<script lang="ts">
  import ToolTypeButton from "./ToolTypeButton.svelte";

  import type { ToolButtonBehavior, ToolButtonComponentProps } from "./Tools";

  let props: ToolButtonComponentProps = $props();

  // rendered in place of the selection button when lasso is the preferred
  // selection tool; the selection shortcut activates it then
  const behavior: ToolButtonBehavior = { shortcutType: "selection" };
</script>

<ToolTypeButton type="lasso" {...props} {behavior} />
