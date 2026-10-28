<script lang="ts">
  import { onDestroy } from "svelte";
  import { Popover } from "bits-ui";

  import {
    COLOR_PALETTE,
    DEFAULT_ELEMENT_BACKGROUND_PICKS,
    DEFAULT_ELEMENT_STROKE_PICKS,
    deriveStylesPanelMode,
  } from "@svelte-draw/common";

  import { getEditorContext } from "../../ui/editorContext";
  import ButtonSeparator from "../ButtonSeparator.svelte";

  import ColorPickerPopupContent from "./ColorPickerPopupContent.svelte";
  import ColorPickerTrigger from "./ColorPickerTrigger.svelte";
  import TopPicks from "./TopPicks.svelte";
  import {
    createColorTopPicksDnD,
    setColorPickerDnD,
  } from "./colorTopPicksDnD";

  import type { ColorPaletteCustom, ColorTuple } from "@svelte-draw/common";
  import type { ExcalidrawElement } from "@svelte-draw/element/types";

  import type { AppState, UIAppState } from "../../types";
  import type { ColorPickerType } from "./colorPickerUtils";

  import "./ColorPicker.scss";

  interface ColorPickerProps {
    type: ColorPickerType;
    /**
     * null indicates no color should be displayed as active
     * (e.g. when multiple shapes selected with different colors)
     */
    color: string | null;
    onChange: (color: string) => void;
    label: string;
    elements: readonly ExcalidrawElement[];
    appState: UIAppState;
    palette?: ColorPaletteCustom | null;
    topPicks?: ColorTuple;
    updateData: (formData?: any) => void;
    /** palette colors to hide from the popup, keeping hotkey positions */
    excludedColors?: readonly string[];
    /** allow users to customize the top picks strip by drag & dropping colors
     * from the picker popup onto it. The value names the
     * `appState.colorTopPicks` slot the customization is stored in */
    customizableTopPicks?: keyof AppState["colorTopPicks"];
    /** accepted for call-site compatibility; like in the React original it is
     * not rendered */
    "data-testid"?: string;
  }

  let {
    type,
    color,
    onChange,
    label,
    elements,
    palette = COLOR_PALETTE,
    topPicks,
    updateData,
    appState,
    excludedColors,
    customizableTopPicks,
  }: ColorPickerProps = $props();

  const isColorPickerPopup = (
    popup: AppState["openPopup"],
  ): popup is ColorPickerType =>
    popup === "elementStroke" ||
    popup === "elementBackground" ||
    popup === "canvasBackground";

  const ctx = getEditorContext();
  const isCompactMode = $derived(
    deriveStylesPanelMode(ctx.editorInterface) !== "full",
  );

  const isTopPicksCustomizable = $derived(
    !!customizableTopPicks && !isCompactMode,
  );

  // user-pinned picks trump the (host-provided or default) baseline
  const customTopPicks = $derived(
    isTopPicksCustomizable && customizableTopPicks
      ? appState.colorTopPicks?.[customizableTopPicks]
      : null,
  );

  // fully-resolved picks currently displayed in the strip — the baseline the
  // drag & drop customization starts from
  const effectiveTopPicks = $derived(
    customTopPicks?.length
      ? customTopPicks
      : topPicks ??
          (type === "elementStroke"
            ? DEFAULT_ELEMENT_STROKE_PICKS
            : DEFAULT_ELEMENT_BACKGROUND_PICKS),
  );

  const resetTopPicks = $derived(
    isTopPicksCustomizable && customizableTopPicks
      ? () => {
          updateData({
            colorTopPicks: {
              ...appState.colorTopPicks,
              [customizableTopPicks]: null,
            },
          });
        }
      : undefined,
  );

  const dnd = createColorTopPicksDnD(() => ({
    enabled: isTopPicksCustomizable,
    picks: effectiveTopPicks,
    onPicksChange: (picks) => {
      if (!customizableTopPicks) {
        return;
      }
      updateData({
        colorTopPicks: {
          ...appState.colorTopPicks,
          [customizableTopPicks]: picks,
        },
      });
    },
  }));
  setColorPickerDnD(() => (isTopPicksCustomizable ? dnd : null));
  onDestroy(dnd.destroy);

  const isOpen = $derived(appState.openPopup === type);
</script>

<div
  role="dialog"
  aria-modal="true"
  class={[
    "color-picker-container",
    { "color-picker-container--no-top-picks": isCompactMode },
  ]}
>
  {#if !isCompactMode}
    <TopPicks
      theme={appState.theme}
      activeColor={color}
      onChange={(pickedColor) => {
        onChange(pickedColor);
        // if another color-picker popup is open, follow the user's
        // focus over to this picker (same as clicking its trigger)
        if (
          isColorPickerPopup(appState.openPopup) &&
          appState.openPopup !== type
        ) {
          // deferred: each updateData spreads the full pre-commit
          // appState, so issuing this in the same task would clobber
          // the color change committed by `onChange` above
          setTimeout(() => updateData({ openPopup: type }), 0);
        }
      }}
      {type}
      topPicks={customTopPicks?.length ? customTopPicks : topPicks}
      isCustomized={!!customTopPicks?.length}
      onReset={resetTopPicks}
    />
    <ButtonSeparator />
  {/if}
  <Popover.Root
    bind:open={
      () => isOpen,
      (open) => {
        if (open) {
          updateData({ openPopup: type });
        }
      }
    }
  >
    <!-- serves as an active color indicator as well -->
    <ColorPickerTrigger
      {color}
      {label}
      {type}
      theme={appState.theme}
      mode={type === "elementStroke" ? "stroke" : "background"}
      editingTextElement={!!appState.editingTextElement}
      onToggle={() => {
        // atomic switch: if another popup is open, close it first, then open this one next tick
        if (appState.openPopup === type) {
          // toggle off on same trigger
          updateData({ openPopup: null });
        } else {
          // open this one (switching from another popup, or none)
          updateData({ openPopup: type });
        }
      }}
    />
    <!-- popup content -->
    {#if isOpen}
      <ColorPickerPopupContent
        {type}
        {color}
        {onChange}
        {label}
        {elements}
        {palette}
        {excludedColors}
        {updateData}
        getOpenPopup={() => appState.openPopup}
        {appState}
        onResetTopPicks={customTopPicks?.length ? resetTopPicks : undefined}
      />
    {/if}
  </Popover.Root>
</div>
