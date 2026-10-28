<script lang="ts">
  import { t } from "../../i18n";
  import UIContent from "../../ui/UIContent.svelte";
  import Icon from "../Icon.svelte";
  import { CloseIcon } from "../icons";

  import "./ViewportStatusFrame.scss";

  import type { ViewportStatusFrame as ViewportStatusFrameType } from "../../types";

  type Props = {
    label: NonNullable<ViewportStatusFrameType["label"]>;
    border?: ViewportStatusFrameType["border"];
  };

  let { label, border }: Props = $props();

  const labelId = $props.id();
</script>

<div
  class={[
    "viewport-status-frame__badge",
    { "viewport-status-frame__badge--clickable": label.onClick },
  ]}
  role="status"
  style:--viewport-status-frame-badge-background={label.background ||
    border ||
    "var(--color-primary)"}
  style:color={label.color}
>
  {#if label.onClick}
    <button
      type="button"
      class="viewport-status-frame__badge-action"
      aria-labelledby={labelId}
      onclick={label.onClick}
    ></button>
  {/if}
  <div
    class="viewport-status-frame__badge-label"
    id={label.onClick ? labelId : undefined}
  >
    {#if label.icon}
      <span class="viewport-status-frame__badge-icon">
        <UIContent content={label.icon} />
      </span>
    {/if}
    <UIContent content={label.label} />
  </div>
  {#if label.onClose}
    <button
      type="button"
      class="viewport-status-frame__badge-close"
      aria-label={t("buttons.close")}
      onclick={label.onClose}
    >
      <Icon icon={CloseIcon} />
    </button>
  {/if}
</div>
