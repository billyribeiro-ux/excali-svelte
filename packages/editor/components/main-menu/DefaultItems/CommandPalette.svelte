<script lang="ts">
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { trackEvent } from "../../../analytics";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { boltIcon } from "../../icons";

  let { class: className }: { class?: string } = $props();

  const ctx = getEditorContext();
</script>

<DropdownMenuItem
  icon={boltIcon}
  data-testid="command-palette-button"
  onSelect={() => {
    trackEvent("command_palette", "open", "menu");
    ctx.setAppState({ openDialog: { name: "commandPalette" } });
  }}
  shortcut={getShortcutFromShortcutName("commandPalette")}
  aria-label={t("commandPalette.title")}
  class={className}
>
  {t("commandPalette.title")}
</DropdownMenuItem>
