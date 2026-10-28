<script lang="ts">
  import { actionLoadScene } from "../../../actions";
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import { LoadIcon } from "../../icons";

  import MenuItem from "./MenuItem.svelte";

  const ctx = getEditorContext();
</script>

{#if !ctx.appState.viewModeEnabled}
  <MenuItem
    onSelect={() => ctx.actionManager.executeAction(actionLoadScene)}
    shortcut={getShortcutFromShortcutName("loadScene")}
    icon={LoadIcon}
  >
    {t("buttons.load")}
  </MenuItem>
{/if}
