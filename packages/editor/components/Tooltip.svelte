<script lang="ts">
  import { hideTooltip, showTooltip } from "./Tooltip";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children?: Snippet;
    label: string;
    long?: boolean;
    style?: string;
    class?: ClassValue;
    disabled?: boolean;
    /** show after a short delay (unless a tooltip was visible just now) */
    delay?: boolean;
  };

  let {
    children,
    label,
    long = false,
    style,
    class: className,
    disabled,
    delay = false,
  }: Props = $props();
</script>

{#if !disabled}
  <!-- hover-only affordance: the tooltip is a visual hint for the wrapped control, which carries its own role and keyboard handling -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class={["excalidraw-tooltip-wrapper", className]}
    onpointerenter={(event) =>
      showTooltip(event.currentTarget, label, { long, delay })}
    onpointerleave={hideTooltip}
    {style}
  >
    {@render children?.()}
  </div>
{/if}
