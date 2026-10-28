<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  import "./Island.scss";

  import type { ViewportUIDock, ViewportUIName } from "../types";

  type Props = {
    children: Snippet;
    padding?: number;
    class?: ClassValue;
    style?: string;
    /** the island element, for hosts that need to measure it */
    element?: HTMLDivElement | null;
    /** marks the island as a canvas-occluding UI surface measured by
     * `getViewportOffsets` (see {@link ViewportUIDock}) */
    "data-viewport-ui"?: ViewportUIDock;
    /** identifies the surface so `getViewportOffsets` can reserve space for
     * it while hidden (see {@link ViewportUIName}) */
    "data-viewport-ui-name"?: ViewportUIName;
  };

  let {
    children,
    padding,
    class: className,
    style,
    element = $bindable(null),
    "data-viewport-ui": viewportUI,
    "data-viewport-ui-name": viewportUIName,
  }: Props = $props();
</script>

<div
  class={["Island", className]}
  style:--padding={padding}
  {style}
  data-viewport-ui={viewportUI}
  data-viewport-ui-name={viewportUIName}
  bind:this={element}
>
  {@render children()}
</div>
