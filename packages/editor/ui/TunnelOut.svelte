<script lang="ts">
  import type { Tunnel } from "./Tunnel.svelte";

  let { tunnel }: { tunnel: Tunnel } = $props();
</script>

{#each tunnel.entries as entry (entry.id)}
  {@render entry.content()}
{/each}
