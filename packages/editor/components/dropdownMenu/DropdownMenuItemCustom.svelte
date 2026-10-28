<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLAttributes } from "svelte/elements";

  type Props = {
    children: Snippet;
    class?: ClassValue;
    selected?: boolean;
  } & Omit<HTMLAttributes<HTMLDivElement>, "class" | "children">;

  let { children, class: className = "", selected, ...rest }: Props = $props();
</script>

<div
  {...rest}
  class={[
    "dropdown-menu-item-base",
    "dropdown-menu-item-custom",
    className,
    { "dropdown-menu-item--selected": selected },
  ]}
>
  {@render children()}
</div>
