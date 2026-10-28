<script lang="ts">
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import Dialog from "../Dialog.svelte";

  import { useMermaidToExcalidrawLib } from "./hooks/useMermaidToExcalidrawLib.svelte";
  import MermaidToExcalidraw from "./MermaidToExcalidraw.svelte";
  import TextToDiagram from "./TextToDiagram.svelte";
  import TTDDialogTab from "./TTDDialogTab.svelte";
  import TTDDialogTabs from "./TTDDialogTabs.svelte";
  import TTDDialogTabTrigger from "./TTDDialogTabTrigger.svelte";
  import TTDDialogTabTriggers from "./TTDDialogTabTriggers.svelte";

  import "./TTDDialog.scss";

  import type { TTDPersistenceAdapter, TTTDDialog } from "./types";

  type Props = {
    tab: "text-to-diagram" | "mermaid";
  } & (
    | {
        onTextSubmit: TTTDDialog.onTextSubmit;
        renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
        renderWarning?: TTTDDialog.renderWarning;
        persistenceAdapter: TTDPersistenceAdapter;
        __fallback?: undefined;
      }
    | { __fallback: true }
  );

  let props: Props = $props();

  const editor = getEditorContext();

  const mermaid = useMermaidToExcalidrawLib(() => editor.app.ownerWindow);
</script>

<Dialog
  class="ttd-dialog"
  onCloseRequest={() => {
    editor.app.setOpenDialog(null);
  }}
  size={1520}
  title={false}
  autofocus={false}
>
  <TTDDialogTabs dialog="ttd" tab={props.tab}>
    {#if props.__fallback}
      <p class="dialog-mermaid-title">{t("mermaid.title")}</p>
    {:else}
      <TTDDialogTabTriggers>
        <TTDDialogTabTrigger tab="text-to-diagram">
          <div class="ttd-dialog-tab-trigger__content">
            {t("labels.textToDiagram")}
            <div class="ttd-dialog-tab-trigger__badge">
              {t("chat.aiBeta")}
            </div>
          </div>
        </TTDDialogTabTrigger>
        <TTDDialogTabTrigger tab="mermaid">
          {t("mermaid.label")}
        </TTDDialogTabTrigger>
      </TTDDialogTabTriggers>
    {/if}

    {#if !props.__fallback}
      <TTDDialogTab class="ttd-dialog-content" tab="text-to-diagram">
        <TextToDiagram
          mermaidToExcalidrawLib={mermaid.lib}
          onRetryLoad={mermaid.retry}
          onTextSubmit={props.onTextSubmit}
          renderWelcomeScreen={props.renderWelcomeScreen}
          renderWarning={props.renderWarning}
          persistenceAdapter={props.persistenceAdapter}
        />
      </TTDDialogTab>
    {/if}
    <TTDDialogTab class="ttd-dialog-content" tab="mermaid">
      <MermaidToExcalidraw
        mermaidToExcalidrawLib={mermaid.lib}
        onRetryLoad={mermaid.retry}
        isActive={props.tab === "mermaid"}
      />
    </TTDDialogTab>
  </TTDDialogTabs>
</Dialog>
