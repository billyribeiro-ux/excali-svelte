<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  import "./Stack.scss";

  type Props = {
    children?: Snippet;
    /** `horizontal` is `Stack.Row`, `vertical` is `Stack.Col` */
    direction: "horizontal" | "vertical";
    gap?: number;
    align?: "start" | "center" | "end" | "baseline";
    justifyContent?: "center" | "space-around" | "space-between";
    class?: ClassValue;
    style?: string;
    /** the stack element */
    element?: HTMLDivElement | null;
  };

  let {
    children,
    direction,
    gap,
    align,
    justifyContent,
    class: className,
    style,
    element = $bindable(null),
  }: Props = $props();

  // user `style` goes last so it wins, like the spread in the React original
  const inlineStyle = $derived(
    [
      gap !== undefined && `--gap: ${gap}`,
      align !== undefined &&
        `${direction === "horizontal" ? "align-items" : "justify-items"}: ${align}`,
      justifyContent !== undefined && `justify-content: ${justifyContent}`,
      style,
    ]
      .filter(Boolean)
      .join("; "),
  );
</script>

<div
  class={["Stack", `Stack_${direction}`, className]}
  style={inlineStyle || undefined}
  bind:this={element}
>
  {@render children?.()}
</div>
