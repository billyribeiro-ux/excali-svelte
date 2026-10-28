<script lang="ts">
  import IconButton from "./IconButton.svelte";
  import { LockedIcon, UnlockedIcon } from "./icons";

  type Props = {
    title?: string;
    checked: boolean;
    onChange?: () => void;
    isMobile?: boolean;
    disabled?: boolean;
  };

  let { title, checked, onChange, isMobile, disabled }: Props = $props();
</script>

<IconButton
  class={["ToolIcon__lock", { "is-mobile": isMobile }]}
  type="toggle"
  icon={checked ? LockedIcon : UnlockedIcon}
  {checked}
  {disabled}
  title={`${title} — Q`}
  aria-label={`${title}`}
  data-testid="toolbar-lock"
  onSelect={() => onChange?.()}
/>
