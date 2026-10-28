<script lang="ts">
  import UIContent from "../ui/UIContent.svelte";

  import { CloseIcon } from "./icons";
  import IconButton from "./IconButton.svelte";

  import "./Toast.scss";

  import type { UIContent as UIContentValue } from "../ui/content";

  const DEFAULT_TOAST_TIMEOUT = 5000;

  type Props = {
    message: UIContentValue;
    onClose: () => void;
    closable?: boolean;
    /** To prevent autoclose, pass duration as Infinity */
    duration?: number;
    style?: string;
  };

  let {
    message,
    onClose,
    closable = false,
    duration = DEFAULT_TOAST_TIMEOUT,
    style,
  }: Props = $props();

  let timer: ReturnType<typeof setTimeout> | undefined;
  const shouldAutoClose = $derived(duration !== Infinity);

  const scheduleTimeout = () => {
    if (!shouldAutoClose) {
      return;
    }
    timer = setTimeout(() => onClose(), duration);
  };

  // (re)start the countdown when the message or duration changes
  $effect(() => {
    void message;
    if (!shouldAutoClose) {
      return;
    }
    scheduleTimeout();
    return () => clearTimeout(timer);
  });
</script>

<div
  class="Toast"
  role="status"
  onmouseenter={shouldAutoClose ? () => clearTimeout(timer) : undefined}
  onmouseleave={shouldAutoClose ? scheduleTimeout : undefined}
  {style}
>
  <div class="Toast__message"><UIContent content={message} /></div>
  {#if closable}
    <IconButton
      icon={CloseIcon}
      aria-label="close"
      type="icon"
      onclick={onClose}
      class="close"
    />
  {/if}
</div>
