<script lang="ts">
  import ToolTypeButton from "./ToolTypeButton.svelte";

  import type { ToolButtonComponentProps } from "./Tools";

  let props: ToolButtonComponentProps = $props();
</script>

<ToolTypeButton type="rectangle" {...props} />
