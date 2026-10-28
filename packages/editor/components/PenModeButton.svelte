<script lang="ts">
  import IconButton from "./IconButton.svelte";
  import { PenModeIcon } from "./icons";

  type Props = {
    title?: string;
    checked: boolean;
    onChange?: () => void;
    isMobile?: boolean;
    penDetected: boolean;
  };

  let { title, checked, onChange, isMobile, penDetected }: Props = $props();
</script>

{#if penDetected}
  <IconButton
    class={["ToolIcon__penMode", { "is-mobile": isMobile }]}
    type="toggle"
    icon={PenModeIcon}
    {checked}
    title={`${title}`}
    aria-label={`${title}`}
    onSelect={() => onChange?.()}
  />
{/if}
