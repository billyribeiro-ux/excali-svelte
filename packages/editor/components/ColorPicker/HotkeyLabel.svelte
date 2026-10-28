<script lang="ts">
  import { isColorDark } from "@svelte-draw/common";

  interface HotkeyLabelProps {
    color: string;
    keyLabel: string | number;
    isShade?: boolean;
  }

  let { color, keyLabel, isShade = false }: HotkeyLabelProps = $props();
</script>

<div
  class="color-picker__button__hotkey-label"
  style:color={isColorDark(color) ? "#fff" : "#000"}
>
  {#if isShade}⇧{/if}{keyLabel}
</div>
