<script lang="ts">
  import InlineIcon from "../InlineIcon.svelte";
  import { collapseDownIcon, collapseUpIcon } from "../icons";

  import type { Snippet } from "svelte";

  type Props = {
    label: Snippet;
    // having it controlled so that the state is managed outside
    // this is to keep the user's previous choice even when the
    // Collapsible is unmounted
    open: boolean;
    openTrigger: () => void;
    children: Snippet;
    class?: string;
    showCollapsedIcon?: boolean;
  };

  let {
    label,
    open,
    openTrigger,
    children,
    class: className,
    showCollapsedIcon = true,
  }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  style="cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
  class={className}
  onclick={openTrigger}
>
  {@render label()}
  {#if showCollapsedIcon}
    <InlineIcon icon={open ? collapseUpIcon : collapseDownIcon} />
  {/if}
</div>
{#if open}
  <div style="display: flex; flex-direction: column;">
    {@render children()}
  </div>
{/if}
