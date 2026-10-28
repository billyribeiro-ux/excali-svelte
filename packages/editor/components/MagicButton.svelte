<script lang="ts">
  import IconButton from "./IconButton.svelte";

  import type { IconDef } from "./icons";

  type Props = {
    title?: string;
    icon: IconDef;
    checked: boolean;
    onChange?: () => void;
    isMobile?: boolean;
  };

  let { title, icon, checked, onChange, isMobile }: Props = $props();
</script>

<IconButton
  class={["ToolIcon__MagicButton", { "is-mobile": isMobile }]}
  type="toggle"
  size="small"
  {icon}
  {checked}
  title={`${title}`}
  aria-label={`${title}`}
  onSelect={() => onChange?.()}
/>
