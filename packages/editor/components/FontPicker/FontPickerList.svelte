<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import {
    arrayToList,
    debounce,
    deriveStylesPanelMode,
  } from "@svelte-draw/common";

  import { Fonts } from "../../fonts";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import PropertiesPopover from "../PropertiesPopover.svelte";
  import QuickSearch from "../QuickSearch.svelte";
  import ScrollableList from "../ScrollableList.svelte";
  import TopPicksTip from "../TopPicksDnD/TopPicksTip.svelte";
  import DropdownMenuGroup from "../dropdownMenu/DropdownMenuGroup.svelte";
  import { DropDownMenuItemBadgeType } from "../dropdownMenu/common";

  import FontPickerListItem from "./FontPickerListItem.svelte";
  import { getFontFamilyIcon, getFontFamilyLabel } from "./FontPickerList";
  import { getFontPickerDnD } from "./fontTopPicksDnD";
  import { fontPickerKeyHandler } from "./keyboardNavHandlers";

  import type { FontFamilyValues } from "@svelte-draw/element/types";

  import type { FontDescriptor } from "./FontPickerList";

  interface FontPickerListProps {
    selectedFontFamily: FontFamilyValues | null;
    hoveredFontFamily: FontFamilyValues | null;
    onSelect: (value: number) => void;
    onHover: (value: number) => void;
    onLeave: () => void;
    onOpen: () => void;
    onClose: () => void;
    /** present only while the top picks are customized */
    onResetTopPicks?: () => void;
  }

  let {
    selectedFontFamily,
    hoveredFontFamily,
    onSelect,
    onHover,
    onLeave,
    onOpen,
    onClose,
    onResetTopPicks,
  }: FontPickerListProps = $props();

  const ctx = getEditorContext();
  const app = $derived(ctx.app);
  const stylesPanelMode = $derived(deriveStylesPanelMode(ctx.editorInterface));
  // present only when the top picks are customizable
  const dndRef = getFontPickerDnD();
  const dnd = $derived(dndRef.current);

  let searchTerm = $state("");

  let searchInputEl = $state<HTMLInputElement | null>(null);
  const inputRef = {
    get current() {
      return searchInputEl;
    },
  };

  // sampled once, when the list opens
  const allFonts = Array.from(Fonts.registered.entries())
    .filter(([_, { metadata }]) => !metadata.private && !metadata.fallback)
    .map(([familyId, { metadata, fontFaces }]) => {
      const fontDescriptor = {
        value: familyId,
        icon: getFontFamilyIcon(familyId),
        text: getFontFamilyLabel(familyId, fontFaces),
      };

      if (metadata.deprecated) {
        Object.assign(fontDescriptor, {
          deprecated: metadata.deprecated,
          badge: {
            type: DropDownMenuItemBadgeType.RED,
            placeholder: t("fontList.badge.old"),
          },
        });
      }

      return fontDescriptor as FontDescriptor;
    })
    .sort((a, b) => (a.text.toLowerCase() > b.text.toLowerCase() ? 1 : -1));

  // cached per selected font family, so hover re-render won't mess it up
  const sceneFamilies = $derived.by(() => {
    void selectedFontFamily;
    return new Set(app.fonts.getSceneFamilies());
  });

  // always show all the fonts in the scene, even those that were deprecated
  const sceneFonts = $derived(
    allFonts.filter((font) => sceneFamilies.has(font.value)),
  );

  const availableFonts = $derived(
    allFonts.filter(
      (font) =>
        !sceneFamilies.has(font.value) &&
        // skip deprecated fonts
        (ctx.props.showDeprecatedFonts || !font.deprecated),
    ),
  );

  const filteredFonts = $derived(
    arrayToList(
      [...sceneFonts, ...availableFonts].filter((font) =>
        font.text?.toLowerCase().includes(searchTerm),
      ),
    ),
  );

  const hoveredFont = $derived.by(() => {
    if (hoveredFontFamily) {
      return filteredFonts.find((font) => font.value === hoveredFontFamily);
    }
    if (selectedFontFamily) {
      return filteredFonts.find((font) => font.value === selectedFontFamily);
    }
    return undefined;
  });

  $effect(() => {
    if (!hoveredFont && searchTerm) {
      if (filteredFonts[0]?.value) {
        // hover first element on search
        onHover(filteredFonts[0].value);
      } else {
        // re-render cache on no results
        onLeave();
      }
    }
  });

  // Create a wrapped onSelect function that preserves caret position
  const wrappedOnSelect = (fontFamily: FontFamilyValues) => {
    const ownerDocument = app.ownerDocument;
    // Save caret position before font selection if editing text
    let savedSelection: { start: number; end: number } | null = null;
    if (app.state.editingTextElement) {
      const textEditor = ownerDocument.querySelector(
        ".excalidraw-wysiwyg",
      ) as HTMLTextAreaElement;
      if (textEditor) {
        savedSelection = {
          start: textEditor.selectionStart,
          end: textEditor.selectionEnd,
        };
      }
    }

    onSelect(fontFamily);

    // Restore caret position after font selection if editing text
    if (app.state.editingTextElement && savedSelection) {
      app.ownerWindow.setTimeout(() => {
        const textEditor = ownerDocument.querySelector(
          ".excalidraw-wysiwyg",
        ) as HTMLTextAreaElement;
        if (textEditor && savedSelection) {
          textEditor.focus();
          textEditor.selectionStart = savedSelection.start;
          textEditor.selectionEnd = savedSelection.end;
        }
      }, 0);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const handled = fontPickerKeyHandler({
      event,
      inputRef,
      hoveredFont,
      filteredFonts,
      onSelect: wrappedOnSelect,
      onHover,
      onClose,
    });

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  onMount(() => {
    onOpen();

    return () => {
      onClose();
    };
  });

  const sceneFilteredFonts = $derived(
    filteredFonts.filter((font) => sceneFamilies.has(font.value)),
  );

  const availableFilteredFonts = $derived(
    filteredFonts.filter((font) => !sceneFamilies.has(font.value)),
  );

  const onSearch = debounce((term: string) => {
    searchTerm = term;
  }, 20);
  onDestroy(() => onSearch.cancel());
</script>

{#snippet fontItem(font: FontDescriptor, order: number)}
  <FontPickerListItem
    {font}
    {order}
    isHovered={font.value === hoveredFont?.value}
    isSelected={font.value === selectedFontFamily}
    onSelect={wrappedOnSelect}
    {onHover}
  />
{/snippet}

<PropertiesPopover
  class="properties-content"
  container={ctx.container}
  style="width: 15rem;"
  onClose={() => {
    onClose();

    // Refocus text editor when font picker closes if we were editing text
    if (app.state.editingTextElement) {
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
  onpointerleave={onLeave}
  onkeydown={onKeyDown}
  preventAutoFocusOnTouch={!!app.state.editingTextElement}
>
  {#if stylesPanelMode === "full"}
    <QuickSearch
      bind:element={searchInputEl}
      placeholder={t("quickSearch.placeholder")}
      onChange={onSearch}
    />
  {/if}
  <ScrollableList
    class="dropdown-menu fonts manual-hover"
    placeholder={t("fontList.empty")}
    isEmpty={!sceneFilteredFonts.length && !availableFilteredFonts.length}
  >
    {#if sceneFilteredFonts.length}
      <DropdownMenuGroup title={t("fontList.sceneFonts")}>
        {#each sceneFilteredFonts as font, index (font.value)}
          {@render fontItem(font, index)}
        {/each}
      </DropdownMenuGroup>
    {/if}
    {#if availableFilteredFonts.length}
      <DropdownMenuGroup title={t("fontList.availableFonts")}>
        {#each availableFilteredFonts as font, index (font.value)}
          {@render fontItem(font, index + sceneFilteredFonts.length)}
        {/each}
      </DropdownMenuGroup>
    {/if}
  </ScrollableList>
  {#if dnd}
    <TopPicksTip
      class="FontPicker__tip"
      tip={t("fontList.topPicksTip")}
      onReset={onResetTopPicks}
      resetTitle={t("fontList.resetTopPicks")}
    />
  {/if}
</PropertiesPopover>
