<script lang="ts">
  import {
    applyDarkModeFilter,
    isColorDark,
    THEME,
    type ColorPaletteCustom,
  } from "@svelte-draw/common";

  import { useAtom } from "../../editor-jotai";
  import { t } from "../../i18n";

  import HotkeyLabel from "./HotkeyLabel.svelte";
  import {
    activeColorPickerSectionAtom,
    colorPickerHotkeyBindings,
    getColorNameAndShadeFromColor,
  } from "./colorPickerUtils";
  import { getColorPickerDnD } from "./colorTopPicksDnD";

  import type { Theme } from "@svelte-draw/element/types";
  import type { TranslationKeys } from "../../i18n";

  interface PickerColorListProps {
    theme: Theme;
    palette: ColorPaletteCustom;
    color: string | null;
    onChange: (color: string) => void;
    activeShade: number;
    showHotKey?: boolean;
    /**
     * palette colors to hide. Hidden entries keep their position in the hotkey
     * order (their hotkey goes dead instead of remapping the colors after them).
     */
    excludedColors?: readonly string[];
  }

  let {
    theme,
    palette,
    color,
    onChange,
    activeShade,
    showHotKey = true,
    excludedColors,
  }: PickerColorListProps = $props();

  const colorObj = $derived(getColorNameAndShadeFromColor({ color, palette }));
  const activeSection = useAtom(activeColorPickerSectionAtom);
  const dndRef = getColorPickerDnD();
  const dnd = $derived(dndRef.current);

  const entries = $derived(Object.entries(palette));

  const focusIfActive = (key: string) => (el: HTMLButtonElement) => {
    if (colorObj?.colorName === key && activeSection.current === "baseColors") {
      el.focus();
    }
  };
</script>

<div class="color-picker-content--default">
  {#each entries as [key, value], index (key)}
    {@const swatch =
      (Array.isArray(value) ? value[activeShade] : value) || "transparent"}
    {#if excludedColors?.includes(swatch)}
      <!--
        invisible placeholder so the remaining colors keep their exact
        grid positions (and hotkeys) — muscle memory stays intact
      -->
      <div
        class="color-picker__button color-picker__button--large"
        style="visibility: hidden;"
        aria-hidden="true"
      ></div>
    {:else}
      {@const keybinding = colorPickerHotkeyBindings[index]}
      {@const displayColor = applyDarkModeFilter(swatch, theme === THEME.DARK)}
      {@const label = t(
        `colors.${key.replace(/\d+/, "")}` as unknown as TranslationKeys,
        null,
        "",
      )}
      <button
        {@attach focusIfActive(key)}
        tabindex={-1}
        type="button"
        class={[
          "color-picker__button color-picker__button--large",
          {
            "has-outline": !isColorDark(swatch, 255),
            active: colorObj?.colorName === key,
            "is-transparent": swatch === "transparent" || !swatch,
          },
        ]}
        onclick={() => {
          onChange(swatch);
          activeSection.current = "baseColors";
        }}
        onpointerdown={dnd
          ? (event) => dnd.startSourceDrag(event, swatch)
          : undefined}
        title={`${label}${
          swatch.startsWith("#") ? ` ${swatch}` : ""
        } — ${keybinding}`}
        aria-label={`${label} — ${keybinding}`}
        style:--swatch-color={swatch ? displayColor : undefined}
        data-testid={`color-${key}`}
      >
        <div class="color-picker__button-outline"></div>
        {#if showHotKey}
          <HotkeyLabel color={displayColor} keyLabel={keybinding} />
        {/if}
      </button>
    {/if}
  {/each}
</div>
