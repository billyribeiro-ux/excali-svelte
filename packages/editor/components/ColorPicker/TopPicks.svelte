<script lang="ts">
  import {
    applyDarkModeFilter,
    COLOR_OUTLINE_CONTRAST_THRESHOLD,
    DEFAULT_CANVAS_BACKGROUND_PICKS,
    DEFAULT_ELEMENT_BACKGROUND_PICKS,
    DEFAULT_ELEMENT_STROKE_PICKS,
    isColorDark,
    THEME,
  } from "@svelte-draw/common";

  import { t } from "../../i18n";
  import TopPicksContextMenu from "../TopPicksDnD/TopPicksContextMenu.svelte";
  import TopPicksDnDOutline from "../TopPicksDnD/TopPicksDnDOutline.svelte";
  import { getTopPickReorderOffset } from "../TopPicksDnD/topPicksDnD.svelte";

  import { getColorPickerDnD } from "./colorTopPicksDnD";

  import type { Theme } from "@svelte-draw/element/types";

  import type { ColorPickerType } from "./colorPickerUtils";

  interface TopPicksProps {
    theme: Theme;
    onChange: (color: string) => void;
    type: ColorPickerType;
    activeColor: string | null;
    topPicks?: readonly string[];
    /** present when the strip is user-customizable — enables the right-click
     * context menu resetting the strip to its default picks */
    onReset?: () => void;
    /** whether custom picks are currently applied (enables the reset item) */
    isCustomized?: boolean;
  }

  let {
    theme,
    onChange,
    type,
    activeColor,
    topPicks,
    onReset,
    isCustomized,
  }: TopPicksProps = $props();

  const dndRef = getColorPickerDnD();
  const dnd = $derived(dndRef.current);
  const dragState = $derived(dnd?.dragState ?? null);

  const colors = $derived.by(() => {
    let picks: readonly string[] | undefined;
    if (type === "elementStroke") {
      picks = DEFAULT_ELEMENT_STROKE_PICKS;
    }

    if (type === "elementBackground") {
      picks = DEFAULT_ELEMENT_BACKGROUND_PICKS;
    }

    if (type === "canvasBackground") {
      picks = DEFAULT_CANVAS_BACKGROUND_PICKS;
    }

    // this one can overwrite defaults
    if (topPicks) {
      picks = topPicks;
    }

    if (!picks) {
      console.error("Invalid type for TopPicks");
    }
    return picks;
  });
</script>

{#if colors}
  <TopPicksContextMenu
    {onReset}
    isCustomized={!!isCustomized}
    resetLabel={t("colorPicker.resetTopPicks")}
  >
    {#snippet children(menuProps)}
      <div
        {...menuProps}
        class={["color-picker__top-picks top-picks-dnd", { "is-dnd-active": !!dragState }]}
        {@attach dnd?.attachStrip}
      >
        {#if dragState}
          <TopPicksDnDOutline />
        {/if}
        {#each colors as color, index (color)}
          {@const reorderOffset = getTopPickReorderOffset(dragState, index)}
          {@const displayColor = applyDarkModeFilter(
            color,
            theme === THEME.DARK,
          )}
          <button
            class={[
              "color-picker__button top-picks-dnd__pick",
              {
                active: color === activeColor,
                "is-transparent": color === "transparent" || !color,
                "has-outline": !isColorDark(
                  color,
                  COLOR_OUTLINE_CONTRAST_THRESHOLD,
                ),
                "is-dnd-source":
                  dragState?.origin.kind === "pick" &&
                  dragState.origin.index === index,
                "is-dnd-target":
                  dragState?.origin.kind === "source" &&
                  dragState.overIndex === index,
                "is-dnd-duplicate": dragState?.duplicateIndex === index,
              },
            ]}
            style:--swatch-color={displayColor}
            style:transform={reorderOffset
              ? `translateX(${reorderOffset}px)`
              : undefined}
            type="button"
            title={color}
            onclick={() => onChange(color)}
            onpointerdown={dnd
              ? (event) => dnd.startPickDrag(event, index, color)
              : undefined}
            data-testid={`color-top-pick-${color}`}
            data-top-pick-index={index}
          >
            <div class="color-picker__button-outline"></div>
          </button>
        {/each}
      </div>
    {/snippet}
  </TopPicksContextMenu>
{/if}
