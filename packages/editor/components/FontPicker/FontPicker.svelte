<script lang="ts">
  import { onDestroy } from "svelte";
  import { Popover } from "bits-ui";

  import ButtonSeparator from "../ButtonSeparator.svelte";

  import {
    DEFAULT_FONT_TOP_PICKS,
    getFontTopPicks,
  } from "./FontPicker";
  import FontPickerList from "./FontPickerList.svelte";
  import FontPickerTrigger from "./FontPickerTrigger.svelte";
  import FontTopPicks from "./FontTopPicks.svelte";
  import { createFontTopPicksDnD, setFontPickerDnD } from "./fontTopPicksDnD";

  import type { FontFamilyValues } from "@svelte-draw/element/types";

  import "./FontPicker.scss";

  interface FontPickerProps {
    isOpened: boolean;
    selectedFontFamily: FontFamilyValues | null;
    hoveredFontFamily: FontFamilyValues | null;
    /** user-customized top picks (`appState.fontTopPicks`) */
    topPicks: readonly FontFamilyValues[] | null;
    onSelect: (fontFamily: FontFamilyValues) => void;
    onTopPicksChange: (fontTopPicks: FontFamilyValues[] | null) => void;
    onHover: (fontFamily: FontFamilyValues) => void;
    onLeave: () => void;
    onPopupChange: (open: boolean) => void;
    compactMode?: boolean;
  }

  let {
    isOpened,
    selectedFontFamily,
    hoveredFontFamily,
    topPicks,
    onSelect,
    onTopPicksChange,
    onHover,
    onLeave,
    onPopupChange,
    compactMode = false,
  }: FontPickerProps = $props();

  const onSelectCallback = (value: number | false) => {
    if (value) {
      onSelect(value);
    }
  };

  // the strip (and thus its customization) is hidden in compact mode
  const isTopPicksCustomizable = $derived(!compactMode);
  const isCustomized = $derived(!!topPicks?.length);
  const picks = $derived(
    topPicks?.length ? getFontTopPicks(topPicks) : DEFAULT_FONT_TOP_PICKS,
  );

  const resetTopPicks = () => onTopPicksChange(null);

  const dnd = createFontTopPicksDnD(() => ({
    enabled: isTopPicksCustomizable,
    picks,
    onPicksChange: onTopPicksChange,
  }));
  setFontPickerDnD(() => (isTopPicksCustomizable ? dnd : null));
  onDestroy(dnd.destroy);
</script>

<div
  role="dialog"
  aria-modal="true"
  class={["FontPicker__container", { "FontPicker__container--compact": compactMode }]}
>
  {#if !compactMode}
    <FontTopPicks
      {picks}
      {selectedFontFamily}
      onSelect={onSelectCallback}
      {isCustomized}
      onReset={isTopPicksCustomizable ? resetTopPicks : undefined}
    />
    <ButtonSeparator />
  {/if}
  <Popover.Root bind:open={() => isOpened, (open) => onPopupChange(open)}>
    <FontPickerTrigger {selectedFontFamily} {isOpened} {compactMode} />
    {#if isOpened}
      <FontPickerList
        {selectedFontFamily}
        {hoveredFontFamily}
        onSelect={onSelectCallback}
        {onHover}
        {onLeave}
        onOpen={() => onPopupChange(true)}
        onClose={() => onPopupChange(false)}
        onResetTopPicks={isTopPicksCustomizable && isCustomized
          ? resetTopPicks
          : undefined}
      />
    {/if}
  </Popover.Root>
</div>
