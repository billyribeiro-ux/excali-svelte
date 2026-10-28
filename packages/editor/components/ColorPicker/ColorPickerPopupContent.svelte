<script lang="ts">
  import {
    COLOR_PALETTE,
    deriveStylesPanelMode,
    isWritableElement,
  } from "@svelte-draw/common";

  import { useAtom, useSetAtom } from "../../editor-jotai";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import {
    restoreCaretPosition,
    saveCaretPosition,
  } from "../../hooks/textEditorFocus.svelte";
  import { activeEyeDropperAtom } from "../EyeDropper";
  import PropertiesPopover from "../PropertiesPopover.svelte";

  import ColorInput from "./ColorInput.svelte";
  import Picker from "./Picker.svelte";
  import PickerHeading from "./PickerHeading.svelte";
  import { activeColorPickerSectionAtom } from "./colorPickerUtils";

  import type { ColorPaletteCustom } from "@svelte-draw/common";
  import type { ExcalidrawElement } from "@svelte-draw/element/types";

  import type { AppState, UIAppState } from "../../types";
  import type { ColorPickerType } from "./colorPickerUtils";

  type Props = {
    type: ColorPickerType;
    color: string | null;
    onChange: (color: string) => void;
    label: string;
    elements: readonly ExcalidrawElement[];
    palette?: ColorPaletteCustom | null;
    updateData: (formData?: any) => void;
    appState: UIAppState;
    excludedColors?: readonly string[];
    getOpenPopup: () => AppState["openPopup"];
    /** present only while the top picks are customized */
    onResetTopPicks?: () => void;
  };

  let {
    type,
    color,
    onChange,
    label,
    elements,
    palette = COLOR_PALETTE,
    updateData,
    getOpenPopup,
    appState,
    excludedColors,
    onResetTopPicks,
  }: Props = $props();

  const ctx = getEditorContext();
  const app = $derived(ctx.app);
  const stylesPanelMode = $derived(deriveStylesPanelMode(ctx.editorInterface));
  const isCompactMode = $derived(stylesPanelMode !== "full");
  const isMobileMode = $derived(stylesPanelMode === "mobile");
  const setActiveColorPickerSection = useSetAtom(activeColorPickerSectionAtom);

  const eyeDropperState = useAtom(activeEyeDropperAtom);
  const setEyeDropperState = useSetAtom(activeEyeDropperAtom);

  let colorPickerContentEl = $state<HTMLDivElement | null>(null);

  const focusPickerContent = () => {
    colorPickerContentEl?.focus();
  };
</script>

{#snippet colorInputBlock()}
  <div>
    <PickerHeading>{t("colorPicker.hexCode")}</PickerHeading>
    <ColorInput
      color={color || ""}
      {label}
      onChange={(color) => {
        onChange(color);
      }}
      colorPickerType={type}
      placeholder={t("colorPicker.color")}
    />
  </div>
{/snippet}

<PropertiesPopover
  container={ctx.container}
  style="max-width: 13rem;"
  preventAutoFocusOnTouch={!!appState.editingTextElement}
  onFocusOutside={(event) => {
    const target = event.target;
    // focus moving into the top-picks context menu — let the menu keep
    // it (stealing it back would clear the menu's focus-driven
    // `data-highlighted` styling and break its keyboard navigation)
    if (
      target instanceof app.ownerWindow.HTMLElement &&
      target.closest(".top-picks-dnd__context-menu")
    ) {
      event.preventDefault();
      return;
    }
    // refocus due to eye dropper
    if (!isWritableElement(event.target)) {
      if (
        target instanceof app.ownerWindow.HTMLElement &&
        target.matches(":active")
      ) {
        // the focus escaped because a button outside is being pressed
        // (e.g. a top pick) — stealing focus mid-press makes the browser
        // drop the button's activation (`:active` styling), so wait for
        // the release
        app.ownerWindow.addEventListener("pointerup", focusPickerContent, {
          once: true,
        });
      } else {
        focusPickerContent();
      }
    }
    event.preventDefault();
  }}
  onPointerDownOutside={(event) => {
    if (eyeDropperState.current) {
      // prevent from closing if we click outside the popover
      // while eyedropping (e.g. click when clicking the sidebar;
      // the eye-dropper-backdrop is prevented downstream)
      event.preventDefault();
    }
  }}
  onClose={() => {
    // only clear if we're still the active popup (avoid racing with switch)
    if (getOpenPopup() === type) {
      updateData({ openPopup: null });
    }
    setActiveColorPickerSection(null);

    // Refocus text editor when popover closes if we were editing text
    if (appState.editingTextElement) {
      app.ownerWindow.setTimeout(() => {
        const textEditor = app.ownerDocument.querySelector(
          ".excalidraw-wysiwyg",
        ) as HTMLTextAreaElement;
        if (textEditor) {
          textEditor.focus();
        }
      }, 0);
    }
  }}
>
  {#if palette}
    <Picker
      bind:ref={colorPickerContentEl}
      {palette}
      {excludedColors}
      {onResetTopPicks}
      {color}
      theme={appState.theme}
      onChange={(changedColor) => {
        // Save caret position before color change if editing text
        const savedSelection = appState.editingTextElement
          ? saveCaretPosition(app.ownerDocument)
          : null;

        onChange(changedColor);

        // Restore caret position after color change if editing text
        if (appState.editingTextElement && savedSelection) {
          restoreCaretPosition(savedSelection, app.ownerDocument);
        }
      }}
      onEyeDropperToggle={(force) => {
        setEyeDropperState((state) => {
          if (force) {
            state = state || {
              keepOpenOnAlt: true,
              onSelect: onChange,
              colorPickerType: type,
            };
            state.keepOpenOnAlt = true;
            return state;
          }

          return force === false || state
            ? null
            : {
                keepOpenOnAlt: false,
                onSelect: onChange,
                colorPickerType: type,
              };
        });
      }}
      onEscape={() => {
        if (eyeDropperState.current) {
          setEyeDropperState(null);
        } else {
          // close explicitly on Escape
          updateData({ openPopup: null });
        }
      }}
      {type}
      {elements}
      {updateData}
      showTitle={isCompactMode}
      showHotKey={!isMobileMode}
    >
      {@render colorInputBlock()}
    </Picker>
  {:else}
    {@render colorInputBlock()}
  {/if}
</PropertiesPopover>
