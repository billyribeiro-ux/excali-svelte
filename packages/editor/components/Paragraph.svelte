<script lang="ts">
  import type { Snippet } from "svelte";

  let { children, style }: { children?: Snippet; style?: string } = $props();
</script>

<p class="excalidraw__paragraph" {style}>
  {@render children?.()}
</p>
