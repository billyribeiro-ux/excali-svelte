<script lang="ts">
  import { Popover } from "bits-ui";

  import { MOBILE_ACTION_BUTTON_BG } from "@svelte-draw/common";

  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import IconButton from "../IconButton.svelte";
  import { TextIcon } from "../icons";

  import type { FontFamilyValues } from "@svelte-draw/element/types";

  interface FontPickerTriggerProps {
    selectedFontFamily: FontFamilyValues | null;
    isOpened?: boolean;
    compactMode?: boolean;
  }

  let {
    isOpened = false,
    compactMode = false,
  }: FontPickerTriggerProps = $props();

  const ctx = getEditorContext();

  const style = $derived(
    `border: none;${
      compactMode
        ? ` background: ${MOBILE_ACTION_BUTTON_BG.background}; width: 2rem; height: 2rem;`
        : ""
    }`,
  );
</script>

<Popover.Trigger>
  {#snippet child({ props })}
    <!--
      the wrapper only takes the popover's click toggle: the keydown handler
      would swallow Enter/Space of the inner button and `type` is meaningless
      on a div
    -->
    {@const {
      onkeydown: _onkeydown,
      type: _type,
      disabled: _disabled,
      ...wrapperProps
    } = props}
    <div
      {...wrapperProps}
      data-openpopup="fontFamily"
      class="properties-trigger"
    >
      <IconButton
        type="toggle"
        icon={TextIcon}
        title={t("labels.showFonts")}
        aria-label={t("labels.showFonts")}
        class="standalone properties-trigger"
        data-testid="font-family-show-fonts"
        checked={isOpened}
        onSelect={() => {
          ctx.setAppState((appState) => ({
            openPopup:
              appState.openPopup === "fontFamily" ? null : appState.openPopup,
          }));
        }}
        {style}
      />
    </div>
  {/snippet}
</Popover.Trigger>
