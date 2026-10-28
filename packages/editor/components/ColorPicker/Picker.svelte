<script lang="ts">
  import { onMount, untrack } from "svelte";

  import {
    DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX,
    DEFAULT_ELEMENT_STROKE_COLOR_INDEX,
    KEYS,
  } from "@svelte-draw/common";

  import { useAtom, useSetAtom } from "../../editor-jotai";
  import { t } from "../../i18n";
  import TopPicksTip from "../TopPicksDnD/TopPicksTip.svelte";

  import CustomColorList from "./CustomColorList.svelte";
  import PickerColorList from "./PickerColorList.svelte";
  import PickerHeading from "./PickerHeading.svelte";
  import ShadeList from "./ShadeList.svelte";
  import {
    activeColorPickerSectionAtom,
    getColorNameAndShadeFromColor,
    getMostUsedCustomColors,
    isCustomColor,
  } from "./colorPickerUtils";
  import { colorPickerKeyNavHandler } from "./keyboardNavHandlers";
  import { getColorPickerDnD } from "./colorTopPicksDnD";

  import type { Snippet } from "svelte";
  import type { ExcalidrawElement, Theme } from "@svelte-draw/element/types";
  import type { ColorPaletteCustom } from "@svelte-draw/common";

  import type { ColorPickerType } from "./colorPickerUtils";

  interface PickerProps {
    theme: Theme;
    color: string | null;
    onChange: (color: string) => void;
    type: ColorPickerType;
    elements: readonly ExcalidrawElement[];
    palette: ColorPaletteCustom;
    updateData: (formData?: any) => void;
    children?: Snippet;
    showTitle?: boolean;
    onEyeDropperToggle: (force?: boolean) => void;
    onEscape: (event: KeyboardEvent) => void;
    showHotKey?: boolean;
    excludedColors?: readonly string[];
    /** present only while the top picks are customized */
    onResetTopPicks?: () => void;
    /** the focusable picker content element */
    ref?: HTMLDivElement | null;
  }

  let {
    theme,
    color,
    onChange,
    type,
    elements,
    palette,
    updateData,
    children,
    showTitle,
    onEyeDropperToggle,
    onEscape,
    showHotKey = true,
    excludedColors,
    onResetTopPicks,
    ref = $bindable(null),
  }: PickerProps = $props();

  const title = $derived(
    showTitle
      ? type === "elementStroke"
        ? t("labels.stroke")
        : type === "elementBackground"
        ? t("labels.background")
        : null
      : null,
  );

  // sampled once, when the popup opens (most-used custom colors)
  const customColors: string[] = untrack(() =>
    type === "canvasBackground"
      ? []
      : getMostUsedCustomColors(elements, type, palette),
  );

  const activeSection = useAtom(activeColorPickerSectionAtom);
  const setActiveColorPickerSection = useSetAtom(activeColorPickerSectionAtom);
  const dndRef = getColorPickerDnD();
  const dnd = $derived(dndRef.current);

  const colorObj = $derived(getColorNameAndShadeFromColor({ color, palette }));

  $effect(() => {
    if (!activeSection.current) {
      const isCustom = !!color && isCustomColor({ color, palette });
      const isCustomButNotInList = isCustom && !customColors.includes(color);

      setActiveColorPickerSection(
        isCustomButNotInList
          ? null
          : isCustom
          ? "custom"
          : colorObj?.shade != null
          ? "shades"
          : "baseColors",
      );
    }
  });

  // remembers the last shade the color was at (a custom color has none)
  let activeShade = $state(
    untrack(
      () =>
        colorObj?.shade ??
        (type === "elementBackground"
          ? DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX
          : DEFAULT_ELEMENT_STROKE_COLOR_INDEX),
    ),
  );

  $effect(() => {
    if (colorObj?.shade != null) {
      activeShade = colorObj.shade;
    }
  });

  const onKeyUpCapture = (event: KeyboardEvent) => {
    if (event.key === KEYS.ALT) {
      onEyeDropperToggle(false);
    }
  };

  onMount(() => {
    ref?.focus();
  });

</script>

<svelte:document onkeyupcapture={onKeyUpCapture} />

<div role="dialog" aria-modal="true" aria-label={t("labels.colorPicker")}>
  <div
    bind:this={ref}
    onkeydown={(event) => {
      const handled = colorPickerKeyNavHandler({
        event,
        activeColorPickerSection: activeSection.current,
        palette,
        color,
        onChange,
        onEyeDropperToggle,
        customColors,
        setActiveColorPickerSection,
        updateData,
        activeShade,
        onEscape,
        excludedColors,
      });

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }}
    class="color-picker-content properties-content"
    role="presentation"
    tabindex="-1"
  >
    {#if title}
      <div class="color-picker__title">{title}</div>
    {/if}

    {#if customColors.length}
      <div>
        <PickerHeading>
          {t("colorPicker.mostUsedCustomColors")}
        </PickerHeading>
        <CustomColorList
          {theme}
          colors={customColors}
          {color}
          label={t("colorPicker.mostUsedCustomColors")}
          {onChange}
        />
      </div>
    {/if}

    <div>
      <PickerHeading>{t("colorPicker.colors")}</PickerHeading>
      <PickerColorList
        {theme}
        {color}
        {palette}
        {onChange}
        {activeShade}
        {showHotKey}
        {excludedColors}
      />
    </div>

    <div>
      <PickerHeading>{t("colorPicker.shades")}</PickerHeading>
      <ShadeList {theme} {color} {onChange} {palette} {showHotKey} />
    </div>
    {@render children?.()}
    <!-- dnd context is only provided when top picks are customizable -->
    {#if dnd}
      <TopPicksTip
        tip={t("colorPicker.topPicksTip")}
        onReset={onResetTopPicks}
        resetTitle={t("colorPicker.resetTopPicks")}
      />
    {/if}
  </div>
</div>
