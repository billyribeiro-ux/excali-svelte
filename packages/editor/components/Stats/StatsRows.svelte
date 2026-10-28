<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "class"> & {
    children: Snippet;
    order?: number;
    style?: string;
  };

  let { children, order, style, ...rest }: Props = $props();
</script>

<div
  class="exc-stats__rows"
  style="{order !== undefined ? `order: ${order};` : ''}{style ? ` ${style}` : ''}"
  {...rest}
>
  {@render children()}
</div>
