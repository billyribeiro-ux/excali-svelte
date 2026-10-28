<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div class="ttd-dialog-panels">
  {@render children()}
</div>
