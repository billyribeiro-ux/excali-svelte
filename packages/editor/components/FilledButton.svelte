<script lang="ts">
  import { isPromiseLike } from "@svelte-draw/common";

  import { AbortError } from "../errors";

  import Icon from "./Icon.svelte";
  import Spinner from "./Spinner.svelte";
  import { tablerCheckIcon } from "./icons";

  import "./FilledButton.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type { ButtonColor, ButtonSize, ButtonVariant } from "./FilledButton";
  import type { IconDef } from "./icons";

  type Props = {
    label?: string;
    children?: Snippet;
    /** may return a promise, in which case a loading state is shown */
    onclick?: (event: MouseEvent) => unknown;
    status?: null | "loading" | "success";

    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: ButtonSize;
    class?: ClassValue;
    fullWidth?: boolean;

    icon?: IconDef;
    disabled?: boolean;
    /** the button element */
    element?: HTMLButtonElement | null;
  };

  let {
    children,
    icon,
    onclick,
    label,
    variant = "filled",
    color = "primary",
    size = "medium",
    fullWidth,
    class: className,
    status,
    disabled,
    element = $bindable(null),
  }: Props = $props();

  let isLoading = $state(false);

  const handleClick = async (event: MouseEvent) => {
    const ret = onclick?.(event);

    if (isPromiseLike(ret)) {
      // delay loading state to prevent flicker in case of quick response
      const timer = window.setTimeout(() => {
        isLoading = true;
      }, 50);
      try {
        await ret;
      } catch (error: any) {
        if (!(error instanceof AbortError)) {
          throw error;
        } else {
          console.warn(error);
        }
      } finally {
        clearTimeout(timer);
        isLoading = false;
      }
    }
  };

  const _status = $derived(isLoading ? "loading" : status);
  const _color = $derived(_status === "success" ? "success" : color);
</script>

<button
  class={[
    "ExcButton",
    `ExcButton--color-${_color}`,
    `ExcButton--variant-${variant}`,
    `ExcButton--size-${size}`,
    `ExcButton--status-${_status}`,
    { "ExcButton--fullWidth": fullWidth },
    className,
  ]}
  onclick={handleClick}
  type="button"
  aria-label={label}
  bind:this={element}
  disabled={disabled || _status === "loading" || _status === "success"}
>
  <div class="ExcButton__contents">
    {#if _status === "loading"}
      <Spinner class="ExcButton__statusIcon" />
    {:else if _status === "success"}
      <div class="ExcButton__statusIcon"><Icon icon={tablerCheckIcon} /></div>
    {/if}
    {#if icon}
      <div class="ExcButton__icon" aria-hidden="true">
        <Icon {icon} />
      </div>
    {/if}
    {#if variant !== "icon"}
      {#if children}{@render children()}{:else}{label}{/if}
    {/if}
  </div>
</button>
