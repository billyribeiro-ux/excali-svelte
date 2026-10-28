<script lang="ts">
  import { untrack, type Snippet } from "svelte";

  import {
    DEFAULT_EXPORT_PADDING,
    EXPORT_IMAGE_TYPES,
    isFirefox,
    EXPORT_SCALES,
    cloneJSON,
  } from "@svelte-draw/common";

  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";

  import {
    actionExportWithDarkMode,
    actionChangeExportBackground,
    actionChangeExportEmbedScene,
    actionChangeExportScale,
    actionChangeProjectName,
  } from "../actions/actionExport";
  import { probablySupportsClipboardBlob } from "../clipboard";
  import { prepareElementsForExport } from "../data";
  import { canvasToBlob } from "../data/blob";
  import { nativeFileSystemSupported } from "../data/filesystem";
  import { t } from "../i18n";
  import { isSomeElementSelected } from "../scene";
  import { exportScene, getExportConfigFromAppState } from "../scene/export";

  import { copyIcon, downloadIcon, helpIcon } from "./icons";
  import Dialog from "./Dialog.svelte";
  import ErrorCanvasPreview from "./ErrorCanvasPreview.svelte";
  import FilledButton from "./FilledButton.svelte";
  import Icon from "./Icon.svelte";
  import RadioGroup from "./RadioGroup.svelte";
  import Switch from "./Switch.svelte";
  import Tooltip from "./Tooltip.svelte";

  import "./ImageExportDialog.scss";

  import type { ActionManager } from "../actions/manager";
  import type { AppClassProperties, BinaryFiles, UIAppState } from "../types";

  type Props = {
    appState: UIAppState;
    elements: readonly NonDeletedExcalidrawElement[];
    files: BinaryFiles;
    actionManager: ActionManager;
    onExportImage: AppClassProperties["onExportImage"];
    onCloseRequest: () => void;
    name: string;
  };

  let {
    elements,
    appState,
    files,
    actionManager,
    onExportImage,
    onCloseRequest,
    name,
  }: Props = $props();

  const COPY_STATUS_TIMEOUT = 2000;

  // we need to take a snapshot so that the exported state can't be modified
  // while the dialog is open
  const { appStateSnapshot, elementsSnapshot } = untrack(() => ({
    appStateSnapshot: cloneJSON(appState) as Readonly<UIAppState>,
    elementsSnapshot: cloneJSON(elements) as readonly NonDeletedExcalidrawElement[],
  }));

  const exportWithDarkMode = $derived(appState.exportWithDarkMode);

  const hasSelection = isSomeElementSelected(
    elementsSnapshot,
    appStateSnapshot,
  );

  let projectName = $state(untrack(() => name));
  let exportSelectionOnly = $state(hasSelection);
  let exportWithBackground = $state(appStateSnapshot.exportBackground);
  let embedScene = $state(appStateSnapshot.exportEmbedScene);
  let exportScale = $state(appStateSnapshot.exportScale);

  let previewNode: HTMLDivElement | undefined = $state();
  let previewRenderRequestId = 0;
  let renderError = $state.raw<Error | null>(null);

  let copyStatus = $state<"success" | null>(null);
  let copyTimeout = 0;

  const onCopy = () => {
    window.clearTimeout(copyTimeout);
    copyStatus = "success";
    copyTimeout = window.setTimeout(() => {
      copyStatus = null;
    }, COPY_STATUS_TIMEOUT);
  };

  const resetCopyStatus = () => {
    copyStatus = null;
  };

  $effect(() => () => window.clearTimeout(copyTimeout));

  $effect(() => {
    // if user changes setting right after export to clipboard, reset the status
    // so they don't have to wait for the timeout to click the button again
    void [
      projectName,
      exportWithBackground,
      exportWithDarkMode,
      exportScale,
      embedScene,
    ];
    resetCopyStatus();
  });

  const exported = $derived(
    prepareElementsForExport(
      elementsSnapshot,
      appStateSnapshot,
      exportSelectionOnly,
    ),
  );
  const exportedElements = $derived(exported.exportedElements);
  const exportingFrame = $derived(exported.exportingFrame);

  $effect(() => {
    const node = previewNode;
    if (!node) {
      return;
    }
    const maxWidth = node.offsetWidth;
    const maxHeight = node.offsetHeight;
    if (!maxWidth) {
      return;
    }

    const requestId = ++previewRenderRequestId;
    const isStaleRequest = () => requestId !== previewRenderRequestId;

    exportScene({
      type: "canvas",
      data: {
        elements: exportedElements,
        appState: appStateSnapshot,
        files,
      },
      config: {
        ...getExportConfigFromAppState({
          ...appStateSnapshot,
          exportBackground: exportWithBackground,
          exportWithDarkMode,
          // the preview fits `maxWidthOrHeight`
          exportScale: 1,
        }),
        padding: DEFAULT_EXPORT_PADDING,
        maxWidthOrHeight: Math.max(maxWidth, maxHeight),
        exportingFrame,
      },
    })
      .then(async (canvas) => {
        if (isStaleRequest()) {
          return;
        }

        // If converting to blob fails, there's some problem that will likely
        // prevent preview and export (e.g. canvas too big).
        try {
          await canvasToBlob(canvas);
        } catch (error: any) {
          if (error.name === "CANVAS_POSSIBLY_TOO_BIG") {
            throw new Error(t("canvasError.canvasTooBig"));
          }
          throw error;
        }

        if (isStaleRequest()) {
          return;
        }

        renderError = null;
        node.replaceChildren(canvas);
      })
      .catch((error) => {
        if (isStaleRequest()) {
          return;
        }

        console.error(error);
        renderError = error;
      });

    return () => {
      previewRenderRequestId += 1;
    };
  });
</script>

{#snippet exportSetting(
  label: string,
  settingName: string,
  content: Snippet,
  tooltip?: string,
)}
  <div class="ImageExportModal__settings__setting" title={label}>
    <label
      for={settingName}
      class="ImageExportModal__settings__setting__label"
    >
      {label}
      {#if tooltip}
        <Tooltip label={tooltip} long={true}>
          <Icon icon={helpIcon} />
        </Tooltip>
      {/if}
    </label>
    <div class="ImageExportModal__settings__setting__content">
      {@render content()}
    </div>
  </div>
{/snippet}

{#snippet onlySelectedSwitch()}
  <Switch
    name="exportOnlySelected"
    checked={exportSelectionOnly}
    onChange={(checked: boolean) => {
      exportSelectionOnly = checked;
    }}
  />
{/snippet}

{#snippet backgroundSwitch()}
  <Switch
    name="exportBackgroundSwitch"
    checked={exportWithBackground}
    onChange={(checked: boolean) => {
      exportWithBackground = checked;
      actionManager.executeAction(actionChangeExportBackground, "ui", checked);
    }}
  />
{/snippet}

{#snippet darkModeSwitch()}
  <Switch
    name="exportDarkModeSwitch"
    checked={exportWithDarkMode}
    onChange={(checked: boolean) => {
      actionManager.executeAction(actionExportWithDarkMode, "ui", checked);
    }}
  />
{/snippet}

{#snippet embedSwitch()}
  <Switch
    name="exportEmbedSwitch"
    checked={embedScene}
    onChange={(checked: boolean) => {
      embedScene = checked;
      actionManager.executeAction(actionChangeExportEmbedScene, "ui", checked);
    }}
  />
{/snippet}

{#snippet scaleRadio()}
  <RadioGroup
    name="exportScale"
    value={exportScale}
    onChange={(scale: number) => {
      exportScale = scale;
      actionManager.executeAction(actionChangeExportScale, "ui", scale);
    }}
    choices={EXPORT_SCALES.map((scale) => ({
      value: scale,
      label: `${scale}×`,
    }))}
  />
{/snippet}

<Dialog {onCloseRequest} size="wide" title={false}>
  <div class="ImageExportModal">
    <h3>{t("imageExportDialog.header")}</h3>
    <div class="ImageExportModal__preview">
      <div class="ImageExportModal__preview__canvas" bind:this={previewNode}>
        {#if renderError}
          <ErrorCanvasPreview />
        {/if}
      </div>
      <div class="ImageExportModal__preview__filename">
        {#if !nativeFileSystemSupported}
          <input
            type="text"
            class="TextInput"
            value={projectName}
            style="width: 30ch"
            oninput={(event) => {
              projectName = event.currentTarget.value;
              actionManager.executeAction(
                actionChangeProjectName,
                "ui",
                event.currentTarget.value,
              );
            }}
          />
        {/if}
      </div>
    </div>
    <div class="ImageExportModal__settings">
      <h3>{t("imageExportDialog.header")}</h3>
      {#if hasSelection}
        {@render exportSetting(
          t("imageExportDialog.label.onlySelected"),
          "exportOnlySelected",
          onlySelectedSwitch,
        )}
      {/if}
      {@render exportSetting(
        t("imageExportDialog.label.withBackground"),
        "exportBackgroundSwitch",
        backgroundSwitch,
      )}
      {@render exportSetting(
        t("imageExportDialog.label.darkMode"),
        "exportDarkModeSwitch",
        darkModeSwitch,
      )}
      {@render exportSetting(
        t("imageExportDialog.label.embedScene"),
        "exportEmbedSwitch",
        embedSwitch,
        t("imageExportDialog.tooltip.embedScene"),
      )}
      {@render exportSetting(
        t("imageExportDialog.label.scale"),
        "exportScale",
        scaleRadio,
      )}

      <div class="ImageExportModal__settings__buttons">
        <FilledButton
          class="ImageExportModal__settings__buttons__button"
          label={t("imageExportDialog.title.exportToPng")}
          onclick={() =>
            onExportImage(EXPORT_IMAGE_TYPES.png, exportedElements, {
              exportingFrame,
            })}
          icon={downloadIcon}
        >
          {t("imageExportDialog.button.exportToPng")}
        </FilledButton>
        <FilledButton
          class="ImageExportModal__settings__buttons__button"
          label={t("imageExportDialog.title.exportToSvg")}
          onclick={() =>
            onExportImage(EXPORT_IMAGE_TYPES.svg, exportedElements, {
              exportingFrame,
            })}
          icon={downloadIcon}
        >
          {t("imageExportDialog.button.exportToSvg")}
        </FilledButton>
        {#if probablySupportsClipboardBlob || isFirefox}
          <FilledButton
            class="ImageExportModal__settings__buttons__button"
            label={t("imageExportDialog.title.copyPngToClipboard")}
            status={copyStatus}
            onclick={async () => {
              await onExportImage(EXPORT_IMAGE_TYPES.clipboard, exportedElements, {
                exportingFrame,
              });
              onCopy();
            }}
            icon={copyIcon}
          >
            {t("imageExportDialog.button.copyPngToClipboard")}
          </FilledButton>
        {/if}
      </div>
    </div>
  </div>
</Dialog>
