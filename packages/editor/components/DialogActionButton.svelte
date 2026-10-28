<script lang="ts">
  import Spinner from "./Spinner.svelte";

  import "./DialogActionButton.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "class" | "children"> & {
    label: string;
    children?: Snippet;
    actionType?: "primary" | "danger";
    isLoading?: boolean;
    class?: ClassValue;
  };

  let {
    label,
    class: className,
    children,
    actionType,
    type = "button",
    isLoading,
    ...rest
  }: Props = $props();
</script>

<button
  class={[
    "Dialog__action-button",
    actionType && `Dialog__action-button--${actionType}`,
    className,
  ]}
  {type}
  aria-label={label}
  {...rest}
>
  {#if children}
    <div style:visibility={isLoading ? "hidden" : undefined}>
      {@render children()}
    </div>
  {/if}
  <div style:visibility={isLoading ? "hidden" : undefined}>{label}</div>
  {#if isLoading}
    <div style="position: absolute; inset: 0">
      <Spinner />
    </div>
  {/if}
</button>
