<script lang="ts">
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { ExportImageIcon } from "../../icons";

  const ctx = getEditorContext();
</script>

<DropdownMenuItem
  icon={ExportImageIcon}
  data-testid="image-export-button"
  onSelect={() => ctx.setAppState({ openDialog: { name: "imageExport" } })}
  shortcut={getShortcutFromShortcutName("imageExport")}
  aria-label={t("buttons.exportImage")}
>
  {t("buttons.exportImage")}
</DropdownMenuItem>
