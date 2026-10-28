<script lang="ts">
  import { FONT_FAMILY } from "@svelte-draw/common";

  import { setEditorContext } from "../../ui/editorContext";

  import FontPicker from "./FontPicker.svelte";

  import type { FontFamilyValues } from "@svelte-draw/element/types";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    initialOpened = false,
    onTopPicksChange,
    onSelect,
  }: {
    ctx: EditorContextValue;
    initialOpened?: boolean;
    onTopPicksChange?: (picks: FontFamilyValues[] | null) => void;
    onSelect?: (fontFamily: FontFamilyValues) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);

  // plays the role of the editor's appState (`openPopup`, `fontTopPicks`...)
  // svelte-ignore state_referenced_locally
  let isOpened = $state(initialOpened);
  let topPicks = $state.raw<readonly FontFamilyValues[] | null>(null);
  let selected = $state<FontFamilyValues | null>(FONT_FAMILY.Excalifont);
  let hovered = $state<FontFamilyValues | null>(null);

  /** like `API.setAppState({ fontTopPicks })` */
  export const setTopPicks = (picks: readonly FontFamilyValues[] | null) => {
    topPicks = picks;
  };
  export const getState = () => ({ isOpened, topPicks, selected });
</script>

<FontPicker
  {isOpened}
  selectedFontFamily={selected}
  hoveredFontFamily={hovered}
  {topPicks}
  onSelect={(fontFamily) => {
    selected = fontFamily;
    onSelect?.(fontFamily);
  }}
  onTopPicksChange={(picks) => {
    topPicks = picks;
    onTopPicksChange?.(picks);
  }}
  onHover={(fontFamily) => {
    hovered = fontFamily;
  }}
  onLeave={() => {
    hovered = null;
  }}
  onPopupChange={(open) => {
    isOpened = open;
  }}
/>
