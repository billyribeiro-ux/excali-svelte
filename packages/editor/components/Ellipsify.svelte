<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
  };

  let { children, style, ...rest }: Props = $props();
</script>

<span
  {...rest}
  style={`text-overflow: ellipsis; overflow: hidden; white-space: nowrap;${style ? ` ${style}` : ""}`}
>
  {@render children?.()}
</span>
