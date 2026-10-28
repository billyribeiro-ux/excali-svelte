<script lang="ts">
  import { getContext } from "svelte";

  import type { Snippet } from "svelte";

  let {
    children,
    onSelect,
    ...rest
  }: {
    children: Snippet;
    onSelect?: (event: Event) => void;
    "data-testid"?: string;
    icon?: unknown;
  } = $props();

  const content = getContext<{ select: () => void }>("dropdown-stub-content");
</script>

<button
  type="button"
  data-testid={rest["data-testid"]}
  onclick={(event) => {
    onSelect?.(event);
    content.select();
  }}
>
  {@render children()}
</button>
