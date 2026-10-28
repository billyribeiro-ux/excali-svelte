<script lang="ts">
  import "./FixedSideContainer.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children?: Snippet;
    side: "top" | "left" | "right";
    class?: ClassValue;
  };

  let { children, side, class: className }: Props = $props();
</script>

<div class={["FixedSideContainer", `FixedSideContainer_side_${side}`, className]}>
  {@render children?.()}
</div>
