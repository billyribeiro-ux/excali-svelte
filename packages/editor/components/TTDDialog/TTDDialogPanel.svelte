<script lang="ts" module>
  import type { IconDef } from "../icons";

  export type TTDPanelAction = {
    label: string;
    action?: () => void;
    icon?: IconDef;
    /** wraps the icon in the inline spacing wrapper (`InlineIcon` look) */
    iconInline?: boolean;
    variant: "button" | "link" | "rateLimit";
    disabled?: boolean;
    className?: string;
  };
</script>

<script lang="ts">
  import Button from "../Button.svelte";
  import Icon from "../Icon.svelte";
  import InlineIcon from "../InlineIcon.svelte";
  import Spinner from "../Spinner.svelte";

  import type { ClassValue } from "svelte/elements";
  import type { Snippet } from "svelte";

  interface Props {
    label?: string | Snippet;
    children: Snippet;
    panelActions?: TTDPanelAction[];
    onTextSubmitInProgess?: boolean;
    renderTopRight?: Snippet;
    renderSubmitShortcut?: Snippet;
    class?: ClassValue;
    panelActionJustifyContent?:
      | "flex-start"
      | "flex-end"
      | "center"
      | "space-between"
      | "space-around"
      | "space-evenly";
  }

  let {
    label,
    children,
    panelActions = [],
    onTextSubmitInProgess,
    renderTopRight,
    renderSubmitShortcut,
    class: className,
    panelActionJustifyContent = "flex-start",
  }: Props = $props();

  const visibleActions = $derived(panelActions.filter(Boolean));
</script>

{#snippet actionIcon(action: TTDPanelAction)}
  {#if action.icon}
    {#if action.iconInline}
      <InlineIcon icon={action.icon} />
    {:else}
      <Icon icon={action.icon} />
    {/if}
  {/if}
{/snippet}

<div class={["ttd-dialog-panel", className]}>
  {#if label || renderTopRight}
    <div class="ttd-dialog-panel__header">
      {#if typeof label === "string"}
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>{label}</label>
      {:else if label}
        {@render label()}
      {/if}
      {@render renderTopRight?.()}
    </div>
  {/if}
  {@render children()}
  <div
    class={[
      "ttd-dialog-panel-button-container",
      { invisible: !panelActions.length },
    ]}
    style:justify-content={panelActionJustifyContent}
  >
    {#each visibleActions as panelAction (panelAction.label)}
      {#if panelAction.variant === "link"}
        <button
          class={["ttd-dialog-panel-action-link", panelAction.className]}
          onclick={panelAction.action}
          disabled={panelAction.disabled || onTextSubmitInProgess}
          type="button"
        >
          {panelAction.label}
          {#if panelAction.icon}
            <span class="ttd-dialog-panel-action-link__icon">
              {@render actionIcon(panelAction)}
            </span>
          {/if}
        </button>
      {:else if panelAction.variant === "button"}
        <Button
          class={["ttd-dialog-panel-button", panelAction.className]}
          onSelect={panelAction.action ? panelAction.action : () => {}}
          disabled={panelAction.disabled || onTextSubmitInProgess}
        >
          <div class={{ invisible: onTextSubmitInProgess }}>
            {panelAction.label}
            {#if panelAction.icon}
              <span>{@render actionIcon(panelAction)}</span>
            {/if}
          </div>
          {#if onTextSubmitInProgess}
            <Spinner />
          {/if}
        </Button>
      {:else if panelAction.variant === "rateLimit"}
        <div class={["ttd-dialog-panel__rate-limit", panelAction.className]}>
          {panelAction.label}
        </div>
      {/if}
    {/each}
    {#if !onTextSubmitInProgess}
      {@render renderSubmitShortcut?.()}
    {/if}
  </div>
</div>
