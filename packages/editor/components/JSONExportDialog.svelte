<script lang="ts" module>
  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";

  export type ExportCB = (
    elements: readonly NonDeletedExcalidrawElement[],
    scale?: number,
  ) => void;
</script>

<script lang="ts">
  import { getFrame } from "@svelte-draw/common";

  import { actionSaveFileToDisk } from "../actions/actionExport";
  import { trackEvent } from "../analytics";
  import { nativeFileSystemSupported } from "../data/filesystem";
  import { t } from "../i18n";
  import ActionPanel from "../actions/ActionPanel.svelte";

  import Card from "./Card.svelte";
  import Dialog from "./Dialog.svelte";
  import IconButton from "./IconButton.svelte";
  import Icon from "./Icon.svelte";
  import { exportToFileIcon, LinkIcon } from "./icons";

  import "./ExportDialog.scss";

  import type { ActionManager } from "../actions/manager";
  import type {
    AppClassProperties,
    BinaryFiles,
    ExportOpts,
    UIAppState,
  } from "../types";

  type Props = {
    elements: readonly NonDeletedExcalidrawElement[];
    appState: UIAppState;
    files: BinaryFiles;
    actionManager: ActionManager;
    exportOpts: ExportOpts;
    canvas: HTMLCanvasElement;
    setAppState: AppClassProperties["setAppState"];
  };

  let {
    elements,
    appState,
    files,
    actionManager,
    exportOpts,
    canvas,
    setAppState,
  }: Props = $props();

  const handleClose = () => {
    setAppState({ openDialog: null });
  };
</script>

{#if appState.openDialog?.name === "jsonExport"}
  <Dialog onCloseRequest={handleClose} title={t("buttons.export")}>
    <div class="ExportDialog ExportDialog--json">
      <div class="ExportDialog-cards">
        {#if exportOpts.saveFileToDisk}
          <Card color="lime">
            <div class="Card-icon"><Icon icon={exportToFileIcon} /></div>
            <h2>{t("exportDialog.disk_title")}</h2>
            <div class="Card-details">
              {t("exportDialog.disk_details")}
              {#if !nativeFileSystemSupported}
                <ActionPanel name="changeProjectName" />
              {/if}
            </div>
            <IconButton
              class="Card-button"
              type="button"
              title={t("exportDialog.disk_button")}
              aria-label={t("exportDialog.disk_button")}
              showAriaLabel={true}
              onclick={() => {
                actionManager.executeAction(actionSaveFileToDisk, "ui");
              }}
            />
          </Card>
        {/if}
        {#if exportOpts.onExportToBackend}
          <Card color="pink">
            <div class="Card-icon"><Icon icon={LinkIcon} /></div>
            <h2>{t("exportDialog.link_title")}</h2>
            <div class="Card-details">{t("exportDialog.link_details")}</div>
            <IconButton
              class="Card-button"
              type="button"
              title={t("exportDialog.link_button")}
              aria-label={t("exportDialog.link_button")}
              showAriaLabel={true}
              onclick={async () => {
                try {
                  trackEvent("export", "link", `ui (${getFrame()})`);
                  await exportOpts.onExportToBackend!(elements, appState, files);
                  handleClose();
                } catch (error: any) {
                  setAppState({ errorMessage: error.message });
                }
              }}
            />
          </Card>
        {/if}
        {#if exportOpts.renderCustomUI}
          {@render exportOpts.renderCustomUI(elements, appState, files, canvas)}
        {/if}
      </div>
    </div>
  </Dialog>
{/if}
