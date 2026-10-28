<script lang="ts">
  import { Popover } from "bits-ui";

  import {
    applyDarkModeFilter,
    COLOR_OUTLINE_CONTRAST_THRESHOLD,
    deriveStylesPanelMode,
    isColorDark,
    THEME,
  } from "@svelte-draw/common";

  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import { temporarilyDisableTextEditorBlur } from "../../hooks/textEditorFocus.svelte";
  import Icon from "../Icon.svelte";
  import { slashIcon, strokeIcon } from "../icons";

  import { getColorPickerDnD } from "./colorTopPicksDnD";

  import type { Theme } from "@svelte-draw/element/types";

  import type { ColorPickerType } from "./colorPickerUtils";

  type Props = {
    color: string | null;
    label: string;
    type: ColorPickerType;
    theme: Theme;
    mode?: "background" | "stroke";
    onToggle: () => void;
    editingTextElement?: boolean;
  };

  let {
    color,
    label,
    type,
    theme,
    mode = "background",
    onToggle,
    editingTextElement,
  }: Props = $props();

  const ctx = getEditorContext();
  const stylesPanelMode = $derived(deriveStylesPanelMode(ctx.editorInterface));
  const isCompactMode = $derived(stylesPanelMode !== "full");
  const isMobileMode = $derived(stylesPanelMode === "mobile");
  const dndRef = getColorPickerDnD();
  const dnd = $derived(dndRef.current);
  const displayColor = $derived(
    color ? applyDarkModeFilter(color, theme === THEME.DARK) : null,
  );

  const handleClick = (event: MouseEvent) => {
    // use pointerdown so we run before outside-close logic
    event.preventDefault();
    event.stopPropagation();

    // If editing text, temporarily disable the wysiwyg blur event
    if (editingTextElement) {
      temporarilyDisableTextEditorBlur(ctx.app.ownerDocument);
    }

    onToggle();
  };
</script>

<Popover.Trigger
  type="button"
  class={[
    "color-picker__button active-color properties-trigger",
    {
      "is-transparent": !color || color === "transparent",
      "has-outline":
        !color || !isColorDark(color, COLOR_OUTLINE_CONTRAST_THRESHOLD),
      "compact-sizing": isCompactMode,
      "mobile-border": isMobileMode,
    },
  ]}
  aria-label={label}
  style={displayColor ? `--swatch-color: ${displayColor}` : undefined}
  title={type === "elementStroke"
    ? t("labels.showStroke")
    : t("labels.showBackground")}
  data-openpopup={type}
  onclick={handleClick}
  onpointerdown={
    // the active-color swatch can be dragged onto the top-picks strip to
    // pin the current (possibly custom) color
    dnd ? (event) => dnd.startSourceDrag(event, color) : undefined
  }
>
  <div class="color-picker__button-outline">
    {#if !color}<Icon icon={slashIcon} />{/if}
  </div>
  {#if isCompactMode && color && mode === "stroke"}
    <div class="color-picker__button-background">
      <span
        style:color={displayColor &&
        isColorDark(displayColor, COLOR_OUTLINE_CONTRAST_THRESHOLD)
          ? "#fff"
          : "#111"}
      >
        <Icon icon={strokeIcon} />
      </span>
    </div>
  {/if}
</Popover.Trigger>
