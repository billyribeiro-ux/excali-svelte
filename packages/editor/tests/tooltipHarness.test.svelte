<script lang="ts">
  import Tooltip from "../components/Tooltip.svelte";

  let {
    labels,
    delay = false,
    disabled = false,
  }: { labels: string[]; delay?: boolean; disabled?: boolean } = $props();
</script>

{#each labels as label (label)}
  <Tooltip {label} {delay} {disabled}>
    <button data-testid={label} aria-label={label}></button>
  </Tooltip>
{/each}
