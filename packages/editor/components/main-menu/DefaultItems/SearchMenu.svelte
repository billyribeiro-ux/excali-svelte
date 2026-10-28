<script lang="ts">
  import { actionToggleSearchMenu } from "../../../actions";
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { searchIcon } from "../../icons";

  let { class: className }: { class?: string } = $props();

  const ctx = getEditorContext();
</script>

<DropdownMenuItem
  icon={searchIcon}
  data-testid="search-menu-button"
  onSelect={() => {
    ctx.actionManager.executeAction(actionToggleSearchMenu);
  }}
  shortcut={getShortcutFromShortcutName("searchMenu")}
  aria-label={t("search.title")}
  class={className}
>
  {t("search.title")}
</DropdownMenuItem>
