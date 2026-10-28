<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "class"> & {
    children: Snippet;
    columns?: number;
    heading?: boolean;
    style?: string;
  };

  let { children, columns = 1, heading, style, ...rest }: Props = $props();
</script>

<div
  class={["exc-stats__row", { "exc-stats__row--heading": heading }]}
  style="grid-template-columns: repeat({columns}, 1fr);{style ? ` ${style}` : ''}"
  {...rest}
>
  {@render children()}
</div>
