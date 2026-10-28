<script lang="ts">
  import { actionLoadScene } from "../../../actions";
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { LoadIcon } from "../../icons";
  import { openConfirmModal } from "../../OverwriteConfirm/OverwriteConfirmState";
  import Trans from "../../Trans.svelte";

  import type { Snippet } from "svelte";

  const ctx = getEditorContext();

  const handleSelect = async () => {
    if (
      !ctx.elements.length ||
      (await openConfirmModal({
        title: t("overwriteConfirm.modal.loadFromFile.title"),
        actionLabel: t("overwriteConfirm.modal.loadFromFile.button"),
        color: "warning",
        description,
      }))
    ) {
      ctx.actionManager.executeAction(actionLoadScene);
    }
  };
</script>

{#snippet bold(children: Snippet)}
  <strong>{@render children()}</strong>
{/snippet}

{#snippet br()}
  <br />
{/snippet}

{#snippet description()}
  <Trans
    i18nKey="overwriteConfirm.modal.loadFromFile.description"
    {bold}
    {br}
  />
{/snippet}

{#if ctx.actionManager.isActionEnabled(actionLoadScene)}
  <DropdownMenuItem
    icon={LoadIcon}
    onSelect={handleSelect}
    data-testid="load-button"
    shortcut={getShortcutFromShortcutName("loadScene")}
    aria-label={t("buttons.load")}
  >
    {t("buttons.load")}
  </DropdownMenuItem>
{/if}
