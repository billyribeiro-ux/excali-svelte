<script lang="ts">
  import { composeEventHandlers } from "@svelte-draw/common";

  import type { ClassValue } from "svelte/elements";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  import "./Button.scss";

  type Props = Omit<HTMLButtonAttributes, "type" | "class"> & {
    type?: "button" | "submit" | "reset";
    onSelect: () => unknown;
    /** whether button is in active state */
    selected?: boolean;
    children: Snippet;
    class?: ClassValue;
  };

  /**
   * A generic button component that follows Excalidraw's design system.
   * Style can be customised using `class` or `style` prop.
   * Accepts all props that a regular `button` element accepts.
   */
  let {
    type = "button",
    onSelect,
    selected,
    children,
    class: className,
    onclick,
    ...rest
  }: Props = $props();

  const handleClick = $derived(
    composeEventHandlers<MouseEvent & { currentTarget: HTMLButtonElement }>(
      onclick as ((event: MouseEvent) => void) | undefined,
      () => {
        onSelect();
      },
    ),
  );
</script>

<button
  {...rest}
  {type}
  class={["excalidraw-button", className, { selected }]}
  onclick={handleClick}
>
  {@render children()}
</button>
