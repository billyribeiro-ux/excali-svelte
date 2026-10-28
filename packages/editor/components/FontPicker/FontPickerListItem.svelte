<script lang="ts">
  import { getFontFamilyString } from "@svelte-draw/common";

  import DropDownMenuItemBadge from "../dropdownMenu/DropDownMenuItemBadge.svelte";
  import MenuItemContent from "../dropdownMenu/DropdownMenuItemContent.svelte";
  import { getDropdownMenuItemClassName } from "../dropdownMenu/common";

  import { getFontPickerDnD } from "./fontTopPicksDnD";

  import type { FontDescriptor } from "./FontPickerList";

  type Props = {
    font: FontDescriptor;
    order: number;
    isHovered: boolean;
    isSelected: boolean;
    onSelect: (fontFamily: number) => void;
    onHover: (fontFamily: number) => void;
  };

  let { font, order, isHovered, isSelected, onSelect, onHover }: Props =
    $props();

  // present only when the top picks are customizable
  const dndRef = getFontPickerDnD();
  const dnd = $derived(dndRef.current);

  let buttonEl = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    if (!isHovered) {
      return;
    }
    if (order === 0) {
      // scroll into the first item differently, so it's visible what is above (i.e. group title)
      buttonEl?.scrollIntoView?.({ block: "end" });
    } else {
      buttonEl?.scrollIntoView?.({ block: "nearest" });
    }
  });
</script>

<button
  bind:this={buttonEl}
  type="button"
  value={font.value}
  class={getDropdownMenuItemClassName("", isSelected, isHovered)}
  title={font.text}
  tabindex={isSelected ? 0 : -1}
  onclick={(event) => {
    onSelect(Number(event.currentTarget.value));
  }}
  onmousemove={() => {
    // don't live-preview fonts the dragged one merely passes over
    if (!dnd?.dragState && !isHovered) {
      onHover(font.value);
    }
  }}
  onpointerdown={dnd
    ? (event) => dnd.startSourceDrag(event, font.value)
    : undefined}
>
  <MenuItemContent
    icon={font.icon}
    textStyle={`font-family: ${getFontFamilyString({
      fontFamily: font.value,
    })}`}
  >
    {#snippet badge()}
      {#if font.badge}
        <DropDownMenuItemBadge type={font.badge.type}>
          {font.badge.placeholder}
        </DropDownMenuItemBadge>
      {/if}
    {/snippet}
    {font.text}
  </MenuItemContent>
</button>
