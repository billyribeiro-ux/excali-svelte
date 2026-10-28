<script lang="ts">
  import { MOBILE_ACTION_BUTTON_BG, deriveStylesPanelMode } from "@svelte-draw/common";

  import IconButton from "../../components/IconButton.svelte";
  import { UndoIcon, RedoIcon } from "../../components/icons";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";

  import { getHistoryContext } from "./historyContext";

  import type { ActionPanelProps } from "../types";

  // shared by the undo and redo actions
  let {
    kind,
    updateData,
    data,
  }: ActionPanelProps & { kind: "undo" | "redo" } = $props();

  const ctx = getEditorContext();
  const history = getHistoryContext();

  let isUndoStackEmpty = $state(history.isUndoStackEmpty);
  let isRedoStackEmpty = $state(history.isRedoStackEmpty);

  $effect(() => {
    return history.onHistoryChangedEmitter.on((event) => {
      isUndoStackEmpty = event.isUndoStackEmpty;
      isRedoStackEmpty = event.isRedoStackEmpty;
    });
  });

  const isMobile = $derived(
    deriveStylesPanelMode(ctx.editorInterface) === "mobile",
  );
</script>

<IconButton
  type="button"
  icon={kind === "undo" ? UndoIcon : RedoIcon}
  aria-label={t(kind === "undo" ? "buttons.undo" : "buttons.redo")}
  onclick={(event: MouseEvent) => updateData(event)}
  size={data?.size || "medium"}
  disabled={kind === "undo" ? isUndoStackEmpty : isRedoStackEmpty}
  data-testid={kind === "undo" ? "button-undo" : "button-redo"}
  style={isMobile
    ? `background: ${MOBILE_ACTION_BUTTON_BG.background}`
    : undefined}
/>
