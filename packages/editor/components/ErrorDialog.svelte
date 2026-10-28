<script lang="ts">
  import { t } from "../i18n";
  import UIContent from "../ui/UIContent.svelte";
  import { getEditorContext } from "../ui/editorContext";

  import Dialog from "./Dialog.svelte";

  import type { Snippet } from "svelte";
  import type { UIContent as UIContentValue } from "../ui/content";

  type Props = {
    /** message to show (e.g. `appState.errorMessage`) */
    content?: UIContentValue | null;
    /** alternative to `content`, declared inline */
    children?: Snippet;
    onClose?: () => void;
  };

  let { content, children, onClose }: Props = $props();

  const ctx = getEditorContext();

  // svelte-ignore state_referenced_locally
  let modalIsShown = $state(!!(content || children));

  const handleClose = () => {
    modalIsShown = false;

    if (onClose) {
      onClose();
    }
    // TODO: Fix the A11y issues so this is never needed since we should always focus on last active element
    ctx.container?.focus();
  };
</script>

{#if modalIsShown}
  <Dialog size="small" onCloseRequest={handleClose} title={t("errorDialog.title")}>
    <div style="white-space: pre-wrap">
      {#if children}{@render children()}{:else}<UIContent {content} />{/if}
    </div>
  </Dialog>
{/if}
