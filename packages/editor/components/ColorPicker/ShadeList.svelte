<script lang="ts">
  import {
    applyDarkModeFilter,
    THEME,
    type ColorPaletteCustom,
  } from "@svelte-draw/common";

  import { useAtom } from "../../editor-jotai";
  import { t } from "../../i18n";

  import HotkeyLabel from "./HotkeyLabel.svelte";
  import {
    activeColorPickerSectionAtom,
    getColorNameAndShadeFromColor,
  } from "./colorPickerUtils";
  import { getColorPickerDnD } from "./colorTopPicksDnD";

  import type { Theme } from "@svelte-draw/element/types";

  interface ShadeListProps {
    theme: Theme;
    color: string | null;
    onChange: (color: string) => void;
    palette: ColorPaletteCustom;
    showHotKey?: boolean;
  }

  let { theme, color, onChange, palette, showHotKey }: ShadeListProps =
    $props();

  const colorObj = $derived(
    getColorNameAndShadeFromColor({
      color: color || "transparent",
      palette,
    }),
  );

  const activeSection = useAtom(activeColorPickerSectionAtom);
  const dndRef = getColorPickerDnD();
  const dnd = $derived(dndRef.current);

  const shades = $derived.by(() => {
    if (colorObj) {
      const candidate = palette[colorObj.colorName];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
    return null;
  });

  const focusIfActive = (index: number) => (el: HTMLButtonElement) => {
    if (index === colorObj?.shade && activeSection.current === "shades") {
      el.focus();
    }
  };
</script>

{#if colorObj && shades}
  <div class="color-picker-content--default shades">
    {#each shades as shadeColor, i (i)}
      {@const displayColor = applyDarkModeFilter(
        shadeColor,
        theme === THEME.DARK,
      )}
      <button
        {@attach focusIfActive(i)}
        tabindex="-1"
        type="button"
        class={[
          "color-picker__button color-picker__button--large",
          { active: i === colorObj.shade },
        ]}
        aria-label="Shade"
        title={`${colorObj.colorName} - ${i + 1}`}
        style:--swatch-color={shadeColor ? displayColor : undefined}
        onclick={() => {
          onChange(shadeColor);
          activeSection.current = "shades";
        }}
        onpointerdown={dnd
          ? (event) => dnd.startSourceDrag(event, shadeColor)
          : undefined}
      >
        <div class="color-picker__button-outline"></div>
        {#if showHotKey}
          <HotkeyLabel color={displayColor} keyLabel={i + 1} isShade />
        {/if}
      </button>
    {/each}
  </div>
{:else}
  <div
    class="color-picker-content--default"
    style="position: relative;"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button
      type="button"
      tabindex="-1"
      class="color-picker__button color-picker__button--large color-picker__button--no-focus-visible"
    ></button>
    <div
      tabindex="-1"
      style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 0.75rem;"
    >
      {t("colorPicker.noShades")}
    </div>
  </div>
{/if}
