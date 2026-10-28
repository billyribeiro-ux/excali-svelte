<script lang="ts">
  import ActionPanel from "../actions/ActionPanel.svelte";

  import type { ShapeActionPredicates } from "./shapeActionPredicates";

  let { predicates }: { predicates: ShapeActionPredicates } = $props();
</script>

{#if predicates.lineEditor}
  <div class="compact-action-item">
    <ActionPanel name="toggleLinearEditor" />
  </div>
{/if}
