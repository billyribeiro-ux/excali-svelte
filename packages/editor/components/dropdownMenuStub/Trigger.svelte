<script lang="ts">
  import type { Snippet } from "svelte";

  let { children, onToggle }: { children: Snippet; onToggle: () => void } =
    $props();
</script>

<button type="button" data-testid="dropdown-menu-button" onclick={onToggle}>
  {@render children()}
</button>
