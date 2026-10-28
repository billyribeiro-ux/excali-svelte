<script lang="ts">
  import "./ScrollableList.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    class?: ClassValue;
    placeholder: string;
    /**
     * Snippets cannot be counted like React `Children`, so the caller says
     * whether there is anything to list (shows `placeholder` when true).
     */
    isEmpty?: boolean;
    children?: Snippet;
  };

  let { class: className, placeholder, isEmpty = false, children }: Props =
    $props();
</script>

<div class={["ScrollableList__wrapper", className]} role="menu">
  {#if isEmpty}
    <div class="empty">{placeholder}</div>
  {:else}
    {@render children?.()}
  {/if}
</div>
