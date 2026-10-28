<script lang="ts">
  import { ContextMenu } from "bits-ui";

  import { getEditorContext } from "../../ui/editorContext";

  import type { Snippet } from "svelte";

  import "./TopPicksDnD.scss";

  /**
   * right-click context menu of a customizable top-picks strip, resetting it
   * to its default picks. Renders the strip as-is when not customizable.
   */
  type Props = {
    /**
     * the strip. Receives the trigger props, which must be spread onto the
     * strip element (`<div {...props}>`); empty when not customizable.
     */
    children: Snippet<[props: Record<string, unknown>]>;
    /** present when the strip is user-customizable */
    onReset?: () => void;
    /** whether custom picks are currently applied (enables the reset item) */
    isCustomized: boolean;
    resetLabel: string;
  };

  let { children, onReset, isCustomized, resetLabel }: Props = $props();

  const ctx = getEditorContext();
</script>

{#if !onReset}
  {@render children({})}
{:else}
  <ContextMenu.Root>
    <ContextMenu.Trigger>
      {#snippet child({ props })}
        {@render children(props)}
      {/snippet}
    </ContextMenu.Trigger>
    <ContextMenu.Portal to={ctx.container ?? undefined}>
      <ContextMenu.Content
        class="top-picks-dnd__context-menu"
        style="z-index: var(--zIndex-ui-styles-popup)"
      >
        <ContextMenu.Item
          class="top-picks-dnd__context-menu-item"
          disabled={!isCustomized}
          onSelect={onReset}
        >
          {resetLabel}
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Portal>
  </ContextMenu.Root>
{/if}
