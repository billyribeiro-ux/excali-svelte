<script lang="ts">
  import { getContext, setContext } from "svelte";

  import type { Snippet } from "svelte";

  let {
    children,
    onSelect,
  }: {
    children?: Snippet;
    onSelect?: () => void;
    onClickOutside?: () => void;
    class?: string;
  } = $props();

  const state = getContext<{ open: boolean }>("dropdown-stub");
  setContext("dropdown-stub-content", {
    select: () => onSelect?.(),
  });
</script>

{#if state.open}
  <div data-stub="dropdown-content">{@render children?.()}</div>
{/if}
