<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    class: className,
    onCloseRequest,
  }: { children: Snippet; class?: string; onCloseRequest: () => void } =
    $props();
</script>

<div class={className}>
  <button data-testid="dialog-close" onclick={onCloseRequest}>x</button>
  {@render children()}
</div>
