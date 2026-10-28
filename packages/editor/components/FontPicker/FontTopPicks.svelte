<script lang="ts">
  import { getFontFamilyString } from "@svelte-draw/common";

  import { t } from "../../i18n";
  import Icon from "../Icon.svelte";
  import TopPicksContextMenu from "../TopPicksDnD/TopPicksContextMenu.svelte";
  import TopPicksDnDOutline from "../TopPicksDnD/TopPicksDnDOutline.svelte";
  import { getTopPickReorderOffset } from "../TopPicksDnD/topPicksDnD.svelte";

  import { getTopPickFont, needsGlyphSample } from "./FontPicker";
  import { getFontPickerDnD } from "./fontTopPicksDnD";

  import type { FontFamilyValues } from "@svelte-draw/element/types";

  type Props = {
    picks: readonly FontFamilyValues[];
    selectedFontFamily: FontFamilyValues | null;
    onSelect: (fontFamily: FontFamilyValues) => void;
    /** present when the strip is user-customizable */
    onReset?: () => void;
    isCustomized: boolean;
  };

  let { picks, selectedFontFamily, onSelect, onReset, isCustomized }: Props =
    $props();

  const dndRef = getFontPickerDnD();
  const dnd = $derived(dndRef.current);
  const dragState = $derived(dnd?.dragState ?? null);
</script>

<TopPicksContextMenu
  {onReset}
  {isCustomized}
  resetLabel={t("fontList.resetTopPicks")}
>
  {#snippet children(menuProps)}
    <div {...menuProps} class="buttonList FontPicker__top-picks">
      <!--
        the drop target (outline & hit area) — hugs the picks, unlike the
        wrapper, which spans its grid column and carries padding
      -->
      <div
        class={[
          "FontPicker__top-picks-slots top-picks-dnd",
          { "is-dnd-active": !!dragState },
        ]}
        {@attach dnd?.attachStrip}
      >
        {#if dragState}
          <TopPicksDnDOutline />
        {/if}
        {#each picks as fontFamily, index (fontFamily)}
          {@const font = getTopPickFont(fontFamily)}
          {@const reorderOffset = getTopPickReorderOffset(dragState, index)}
          <button
            type="button"
            title={font.text}
            data-testid={font.testId}
            class={[
              "top-picks-dnd__pick",
              {
                active: fontFamily === selectedFontFamily,
                "is-dnd-source":
                  dragState?.origin.kind === "pick" &&
                  dragState.origin.index === index,
                "is-dnd-target":
                  dragState?.origin.kind === "source" &&
                  dragState.overIndex === index,
                "is-dnd-duplicate": dragState?.duplicateIndex === index,
              },
            ]}
            style:transform={reorderOffset
              ? `translateX(${reorderOffset}px)`
              : undefined}
            onclick={() => onSelect(fontFamily)}
            onpointerdown={dnd
              ? (event) => dnd.startPickDrag(event, index, fontFamily)
              : undefined}
            data-top-pick-index={index}
          >
            {#if needsGlyphSample(fontFamily, picks)}
              <span
                class="FontPicker__top-pick-sample"
                style:font-family={getFontFamilyString({ fontFamily })}
              >
                Aa
              </span>
            {:else}
              <Icon icon={font.icon} />
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/snippet}
</TopPicksContextMenu>
