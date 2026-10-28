<script lang="ts">
  import IconButton from "./IconButton.svelte";
  import { laserPointerToolIcon } from "./icons";

  type Props = {
    title?: string;
    checked: boolean;
    onChange?: () => void;
    isMobile?: boolean;
  };

  let { title, checked, onChange, isMobile }: Props = $props();
</script>

<IconButton
  class={["ToolIcon__LaserPointer", { "is-mobile": isMobile }]}
  type="toggle"
  size="small"
  icon={laserPointerToolIcon}
  {checked}
  title={`${title}`}
  aria-label={`${title}`}
  data-testid="toolbar-LaserPointer"
  onSelect={() => onChange?.()}
/>
