<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    children: Snippet;
    /** fewer columns, for items rendered with `showNames` */
    showNames?: boolean;
  };

  let { children, showNames }: Props = $props();
</script>

<div
  class={[
    "library-menu-items-container__grid",
    { "library-menu-items-container__grid--named": showNames },
  ]}
>
  {@render children()}
</div>
