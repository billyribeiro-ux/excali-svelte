<script lang="ts">
  import type { UIContent } from "./content";

  let { content }: { content: UIContent | null | undefined } = $props();
</script>

{#if content == null}
  <!-- nothing to render -->
{:else if typeof content === "string"}
  {content}
{:else if typeof content === "function"}
  {@render content()}
{:else}
  {@const Content = content.component}
  <Content {...content.props} />
{/if}
