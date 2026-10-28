<script lang="ts">
  import { isPromiseLike } from "@svelte-draw/common";

  import { AbortError } from "../errors";

  import Icon from "./Icon.svelte";
  import Spinner from "./Spinner.svelte";

  import "./ToolIcon.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type { PointerType } from "@svelte-draw/element/types";
  import type { IconButtonSize } from "./IconButton";
  import type { IconDef } from "./icons";

  type Props = {
    /**
     * - `button`: regular tool button (`onclick` may return a promise)
     * - `icon`: plain icon button (`ToolIcon--plain`)
     * - `toggle`: stateful (pressed/unpressed) tool button
     */
    type: "button" | "icon" | "toggle";
    icon?: IconDef;
    "aria-label": string;
    "aria-keyshortcuts"?: string;
    "data-testid"?: string;
    label?: string;
    title?: string;
    size?: IconButtonSize;
    keyBindingLabel?: string | null;
    showAriaLabel?: boolean;
    hidden?: boolean;
    visible?: boolean;
    disabled?: boolean;
    class?: ClassValue;
    style?: string;
    isLoading?: boolean;
    children?: Snippet;
    /** `button` / `icon` only */
    onclick?: (event: MouseEvent) => unknown;
    /** `toggle` only */
    checked?: boolean;
    /**
     * `toggle` only. Fired on activation — a completed pointer gesture (via
     * `click`, so a press canceled by sliding off the button doesn't select)
     * or keyboard/AT activation, in which case pointerType is null.
     * pointerType is captured on pointer-down, where it's reliable
     * (unlike the click event's own pointerType on iOS).
     */
    onSelect?: (data: { pointerType: PointerType | null }) => void;
    /**
     * `toggle` only. The press that may become a click — e.g. to arm a drag
     * out of the toolbar
     */
    onpointerdown?: (event: PointerEvent) => void;
    /** the button element */
    element?: HTMLButtonElement | null;
  };

  let {
    type,
    size = "medium",
    visible = true,
    class: className = "",
    icon,
    "aria-label": ariaLabel,
    "aria-keyshortcuts": ariaKeyshortcuts,
    "data-testid": testId,
    label,
    title,
    keyBindingLabel,
    showAriaLabel,
    hidden,
    disabled,
    style,
    isLoading: isLoadingProp,
    children,
    onclick,
    checked,
    onSelect,
    onpointerdown,
    element = $bindable(null),
  }: Props = $props();

  const sizeCn = $derived(`ToolIcon_size_${size}`);

  let isLoading = $state(false);

  let isMounted = true;
  $effect(() => {
    isMounted = true;
    return () => {
      isMounted = false;
    };
  });

  const handleClick = async (event: MouseEvent) => {
    const ret = onclick?.(event);

    if (isPromiseLike(ret)) {
      try {
        isLoading = true;
        await ret;
      } catch (error: any) {
        if (!(error instanceof AbortError)) {
          throw error;
        } else {
          console.warn(error);
        }
      } finally {
        if (isMounted) {
          isLoading = false;
        }
      }
    }
  };

  let lastPointerType: PointerType | null = null;
</script>

{#if type === "button" || type === "icon"}
  <button
    class={[
      "ToolIcon_type_button",
      sizeCn,
      className,
      visible && !hidden
        ? "ToolIcon_type_button--show"
        : "ToolIcon_type_button--hide",
      {
        ToolIcon: !hidden,
        "ToolIcon--plain": type === "icon",
      },
    ]}
    {style}
    data-testid={testId}
    {hidden}
    {title}
    aria-label={ariaLabel}
    type="button"
    onclick={handleClick}
    bind:this={element}
    disabled={isLoading || isLoadingProp || !!disabled}
  >
    {#if icon || label}
      <div
        class="ToolIcon__icon"
        aria-hidden="true"
        aria-disabled={!!disabled}
      >
        {#if icon}<Icon {icon} />{:else}{label}{/if}
        {#if keyBindingLabel}
          <span class="ToolIcon__keybinding">{keyBindingLabel}</span>
        {/if}
        {#if isLoadingProp}<Spinner />{/if}
      </div>
    {/if}
    {#if showAriaLabel}
      <div class="ToolIcon__label">
        {ariaLabel}
        {#if isLoading}<Spinner />{/if}
      </div>
    {/if}
    {@render children?.()}
  </button>
{:else}
  <button
    class={[
      "ToolIcon",
      "ToolIcon_type_toggle",
      sizeCn,
      className,
      { "ToolIcon--checked": checked },
    ]}
    type="button"
    {style}
    {title}
    aria-label={ariaLabel}
    aria-keyshortcuts={ariaKeyshortcuts}
    aria-pressed={checked}
    data-testid={testId}
    disabled={!!disabled}
    aria-disabled={!!disabled}
    onpointerdown={(event) => {
      lastPointerType = (event.pointerType as PointerType) || null;
      onpointerdown?.(event);
    }}
    onpointerup={() => {
      requestAnimationFrame(() => {
        lastPointerType = null;
      });
    }}
    onclick={() => {
      onSelect?.({ pointerType: lastPointerType });
    }}
    bind:this={element}
  >
    <div class="ToolIcon__icon">
      {#if icon}<Icon {icon} />{/if}
      {#if keyBindingLabel}
        <span class="ToolIcon__keybinding">{keyBindingLabel}</span>
      {/if}
    </div>
  </button>
{/if}
