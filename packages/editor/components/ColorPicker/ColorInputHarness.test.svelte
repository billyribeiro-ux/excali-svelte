<script lang="ts">
  import ColorInput from "./ColorInput.svelte";

  import type { ColorPickerType } from "./colorPickerUtils";

  let {
    initialColor,
    label,
    colorPickerType,
    placeholder,
  }: {
    initialColor: string;
    label: string;
    colorPickerType: ColorPickerType;
    placeholder?: string;
  } = $props();

  // the host owns the color, like the canvas background picker does
  // svelte-ignore state_referenced_locally
  let color = $state(initialColor);
</script>

<ColorInput
  {color}
  {label}
  {colorPickerType}
  {placeholder}
  onChange={(next) => {
    color = next;
  }}
/>
