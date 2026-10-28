<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    shortcut: string;
    class?: ClassValue;
    children?: Snippet;
  };

  let { shortcut, class: className, children }: Props = $props();

  const keys = $derived(shortcut.replace("++", "+$").split("+"));
</script>

<div class={["shortcut", className]}>
  {#each keys as item, idx (`${idx}-${item}`)}
    <div class="shortcut-wrapper">
      <div class="shortcut-key">{item === "$" ? "+" : item}</div>
    </div>
  {/each}
  <div class="shortcut-desc">{@render children?.()}</div>
</div>
