<script lang="ts">
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { ExportIcon } from "../../icons";

  const ctx = getEditorContext();
</script>

<DropdownMenuItem
  icon={ExportIcon}
  onSelect={() => {
    ctx.setAppState({ openDialog: { name: "jsonExport" } });
  }}
  data-testid="json-export-button"
  aria-label={t("buttons.export")}
>
  {t("buttons.export")}
</DropdownMenuItem>
