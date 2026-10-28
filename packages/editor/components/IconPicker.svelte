<script lang="ts" generics="T">
  import { Popover } from "bits-ui";

  import Icon from "./Icon.svelte";
  import IconPickerContent from "./IconPickerContent.svelte";
  import { findOption } from "./IconPicker";

  import type { PickerSection } from "./IconPicker";

  import "./IconPicker.scss";

  type Props = {
    label: string;
    value: T;
    visibleSections: readonly PickerSection<T>[];
    hiddenSections?: readonly PickerSection<T>[];
    onChange: (value: T) => void;
  };

  let { value, label, visibleSections, hiddenSections, onChange }: Props =
    $props();

  let isActive = $state(false);

  const selectedOption = $derived(
    findOption(visibleSections, (option) => option.value === value) ??
      findOption(hiddenSections ?? [], (option) => option.value === value),
  );
</script>

<div>
  <Popover.Root bind:open={isActive}>
    <Popover.Trigger type="button" aria-label={label} class={isActive ? "active" : ""}>
      {#if selectedOption}
        <Icon icon={selectedOption.icon} />
      {/if}
    </Popover.Trigger>
    {#if isActive}
      <IconPickerContent
        {visibleSections}
        {hiddenSections}
        {value}
        {label}
        {onChange}
        onClose={() => {
          isActive = false;
        }}
      />
    {/if}
  </Popover.Root>
</div>
