<script lang="ts">
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import Button from "../Button.svelte";
  import Icon from "../Icon.svelte";
  import Spinner from "../Spinner.svelte";
  import { alertTriangleIcon } from "../icons";

  import {
    formatMermaidParseErrorMessage,
    getMermaidSyntaxErrorGuidance,
    isMermaidCaretLine,
    isModuleLoadError,
  } from "./utils/mermaidError";

  import type { MermaidToExcalidrawLibProps } from "./types";

  interface Props {
    error: Error | null;
    /** the element the diagram preview canvas is rendered into */
    canvasEl?: HTMLDivElement | null;
    loadStatus: MermaidToExcalidrawLibProps["status"];
    loadErrorReloadRequired?: boolean;
    onRetryLoad?: () => void;
    hideErrorDetails?: boolean;
    sourceText?: string;
    autoFixAvailable?: boolean;
    onApplyAutoFix?: () => void;
  }

  let {
    error,
    canvasEl = $bindable(null),
    loadStatus,
    loadErrorReloadRequired,
    onRetryLoad,
    hideErrorDetails,
    sourceText,
    autoFixAvailable,
    onApplyAutoFix,
  }: Props = $props();

  const editor = getEditorContext();

  const loadFailed = $derived(loadStatus === "error");
  // a chunk failing to load is shown as a load failure (see `loadStatus`),
  // not as a syntax error
  const parseError = $derived(isModuleLoadError(error) ? null : error);

  const errorMessage = $derived(
    parseError
      ? hideErrorDetails
        ? t("chat.errors.mermaidParseError")
        : formatMermaidParseErrorMessage(parseError.message)
      : null,
  );
  const syntaxGuidance = $derived(
    parseError && !hideErrorDetails
      ? getMermaidSyntaxErrorGuidance(parseError.message, sourceText)
      : null,
  );
  const showAutoFixButton = $derived(
    !!autoFixAvailable && !!onApplyAutoFix && !hideErrorDetails,
  );

  const errorMessageLines = $derived(errorMessage?.split(/\r?\n/) ?? []);
</script>

<div
  class={[
    "ttd-dialog-output-wrapper",
    { "ttd-dialog-output-wrapper--error": parseError || loadFailed },
  ]}
>
  {#if parseError && !loadFailed}
    <div data-testid="ttd-dialog-output-error" class="ttd-dialog-output-error">
      <div class="ttd-dialog-output-error-content">
        <div class="ttd-dialog-output-error-icon">
          <Icon icon={alertTriangleIcon} />
        </div>
        {#if syntaxGuidance}
          <div class="ttd-dialog-output-error-summary">
            <div class="ttd-dialog-output-error-summary__headline">
              {syntaxGuidance.summary}
            </div>
            <div class="ttd-dialog-output-error-summary__label">
              Likely causes:
            </div>
            <ul class="ttd-dialog-output-error-summary__causes">
              {#each syntaxGuidance.likelyCauses as cause (cause)}
                <li>{cause}</li>
              {/each}
            </ul>
          </div>
        {/if}
        <div class="ttd-dialog-output-error-message">
          {#each errorMessageLines as line, index (index)}
            <span
              class={isMermaidCaretLine(line)
                ? "ttd-dialog-output-error-message__caret"
                : undefined}>{line}{index < errorMessageLines.length - 1
                ? "\n"
                : ""}</span
            >
          {/each}
        </div>
        {#if !hideErrorDetails}
          <div class="ttd-dialog-output-error-autofix-slot">
            {#if showAutoFixButton}
              <Button
                class="ttd-dialog-panel-button ttd-dialog-output-error-autofix"
                onSelect={() => onApplyAutoFix?.()}
              >
                {t("mermaid.autoFixAvailable")}
              </Button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
  {#if loadFailed}
    <div
      data-testid="ttd-dialog-output-load-error"
      class="ttd-dialog-output-error"
    >
      <div class="ttd-dialog-output-error-content">
        <div class="ttd-dialog-output-error-icon">
          <Icon icon={alertTriangleIcon} />
        </div>
        <div class="ttd-dialog-output-error-title">
          {loadErrorReloadRequired
            ? t("mermaid.loadErrorReload")
            : t("mermaid.loadError")}
        </div>
        {#if loadErrorReloadRequired}
          <Button
            class="ttd-dialog-panel-button"
            onSelect={() => editor.app.ownerWindow.location.reload()}
          >
            {t("mermaid.reload")}
          </Button>
        {:else if onRetryLoad}
          <Button class="ttd-dialog-panel-button" onSelect={onRetryLoad}>
            {t("chat.retry")}
          </Button>
        {/if}
      </div>
    </div>
  {:else if loadStatus === "loaded"}
    <div
      class={[
        "ttd-dialog-output-canvas-container",
        { invisible: !!parseError },
      ]}
    >
      <div bind:this={canvasEl} class="ttd-dialog-output-canvas-content"></div>
    </div>
  {:else}
    <Spinner size="2rem" />
  {/if}
</div>
