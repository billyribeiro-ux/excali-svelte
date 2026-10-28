<script lang="ts">
  import { applyDarkModeFilter, THEME } from "@svelte-draw/common";

  import { useAtom } from "../../editor-jotai";

  import HotkeyLabel from "./HotkeyLabel.svelte";
  import { activeColorPickerSectionAtom } from "./colorPickerUtils";
  import { getColorPickerDnD } from "./colorTopPicksDnD";

  import type { Theme } from "@svelte-draw/element/types";

  interface CustomColorListProps {
    theme: Theme;
    colors: string[];
    color: string | null;
    onChange: (color: string) => void;
    label: string;
  }

  let { theme, colors, color, onChange, label }: CustomColorListProps =
    $props();

  const activeSection = useAtom(activeColorPickerSectionAtom);
  const dndRef = getColorPickerDnD();
  const dnd = $derived(dndRef.current);

  // focus the active button whenever the color / active section changes
  const focusIfActive = (c: string) => (el: HTMLButtonElement) => {
    // tracked: re-runs when either changes
    void activeSection.current;
    if (color === c) {
      el.focus();
    }
  };
</script>

<div class="color-picker-content--default">
  {#each colors as c, i (i)}
    {@const displayColor = applyDarkModeFilter(c, theme === THEME.DARK)}
    <button
      {@attach focusIfActive(c)}
      tabindex={-1}
      type="button"
      class={[
        "color-picker__button color-picker__button--large has-outline",
        { active: color === c, "is-transparent": c === "transparent" || !c },
      ]}
      onclick={() => {
        onChange(c);
        activeSection.current = "custom";
      }}
      onpointerdown={dnd ? (event) => dnd.startSourceDrag(event, c) : undefined}
      title={c}
      aria-label={label}
      style:--swatch-color={displayColor}
    >
      <div class="color-picker__button-outline"></div>
      <HotkeyLabel color={displayColor} keyLabel={i + 1} />
    </button>
  {/each}
</div>
