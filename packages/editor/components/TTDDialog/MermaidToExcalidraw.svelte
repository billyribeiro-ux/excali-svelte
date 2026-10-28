<script lang="ts" module>
  import { debounce } from "@svelte-draw/common";

  import { saveMermaidDataToStorage } from "./common";

  const MERMAID_EXAMPLE =
    "flowchart TD\n A[Christmas] -->|Get money| B(Go shopping)\n B --> C{Let me think}\n C -->|One| D[Laptop]\n C -->|Two| E[iPhone]\n C -->|Three| F[Car]";

  const debouncedSaveMermaidDefinition = debounce(
    saveMermaidDataToStorage,
    300,
  );
  const AUTO_FIX_DEBOUNCE_MS = 500;
  const AUTO_FIX_MAX_DEPTH = 4;
  const AUTO_FIX_MAX_CANDIDATES = 30;

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
    return "";
  };
</script>

<script lang="ts">
  import { EDITOR_LS_KEYS, EVENT, addEventListener, isDevEnv } from "@svelte-draw/common";

  import { EditorLocalStorage } from "../../data/EditorLocalStorage";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import { ArrowRightIcon } from "../icons";
  import Trans from "../Trans.svelte";

  import { convertMermaidToExcalidraw, insertToEditor, resetPreview } from "./common";
  import TTDDialogInput from "./TTDDialogInput.svelte";
  import TTDDialogOutput from "./TTDDialogOutput.svelte";
  import TTDDialogPanel from "./TTDDialogPanel.svelte";
  import TTDDialogPanels from "./TTDDialogPanels.svelte";
  import TTDDialogSubmitShortcut from "./TTDDialogSubmitShortcut.svelte";
  import { getMermaidAutoFixCandidates } from "./utils/mermaidAutoFix";
  import {
    getMermaidErrorLineNumber,
    isMermaidAutoFixableError,
  } from "./utils/mermaidError";

  import "./MermaidToExcalidraw.scss";

  import type { Snippet } from "svelte";
  import type { MermaidData, MermaidToExcalidrawLibProps } from "./types";

  let {
    mermaidToExcalidrawLib,
    onRetryLoad,
    isActive,
  }: {
    mermaidToExcalidrawLib: MermaidToExcalidrawLibProps;
    onRetryLoad?: () => void;
    isActive?: boolean;
  } = $props();

  const editor = getEditorContext();

  let text = $state(
    EditorLocalStorage.get<string>(EDITOR_LS_KEYS.MERMAID_TO_EXCALIDRAW) ||
      MERMAID_EXAMPLE,
  );
  let error = $state.raw<Error | null>(null);
  let autoFixCandidate = $state<string | null>(null);
  let canvasEl = $state<HTMLDivElement | null>(null);

  const canvasRef = {
    get current() {
      return canvasEl;
    },
  };
  const data: { current: MermaidData } = {
    current: { elements: [], files: null },
  };

  const setError = (value: Error | null) => {
    error = value;
  };

  const errorLine = $derived(
    error?.message ? getMermaidErrorLineNumber(error.message, text) : null,
  );
  const theme = $derived(editor.appState.theme);

  $effect(() => {
    const definition = text;
    const lib = mermaidToExcalidrawLib;
    const currentTheme = theme;
    const active = isActive;
    // the preview canvas only exists once the lib loaded
    const canvas = canvasEl;

    if (!active) {
      return;
    }

    const doRender = async () => {
      if (lib.status !== "loaded" || !canvas) {
        return;
      }
      try {
        if (!definition.trim()) {
          resetPreview({ canvasRef, setError });
          return;
        }
        const result = await convertMermaidToExcalidraw({
          canvasRef,
          data,
          mermaidToExcalidrawLib: lib,
          setError,
          mermaidDefinition: definition,
          theme: currentTheme,
        });

        if (!result.success) {
          const err = result.error ?? new Error("Invalid mermaid definition");
          setError(err);
        }
      } catch (err) {
        if (isDevEnv()) {
          console.error("Failed to parse mermaid definition", err);
        }
      }
    };

    doRender();
    debouncedSaveMermaidDefinition(definition);
  });

  $effect(() => {
    const flush = () => debouncedSaveMermaidDefinition.flush();
    const unsubscribe = addEventListener(
      editor.app.ownerWindow,
      EVENT.BEFORE_UNLOAD,
      flush,
    );
    return () => {
      unsubscribe();
      flush();
    };
  });

  $effect(() => {
    const errorMessage = error?.message ?? "";
    const sourceText = text;
    const lib = mermaidToExcalidrawLib;
    const shouldTryAutoFix =
      isActive &&
      isMermaidAutoFixableError(errorMessage) &&
      !!sourceText.trim() &&
      lib.status === "loaded";

    if (!shouldTryAutoFix) {
      autoFixCandidate = null;
      return;
    }

    const candidates = getMermaidAutoFixCandidates(sourceText, errorMessage);
    if (!candidates.length) {
      autoFixCandidate = null;
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const api = await lib.api;
        const seen = new Set<string>([sourceText]);
        const queue = candidates.map((candidate) => ({
          text: candidate,
          depth: 1,
        }));

        let triedCandidates = 0;

        while (queue.length > 0 && triedCandidates < AUTO_FIX_MAX_CANDIDATES) {
          const current = queue.shift();
          if (!current || seen.has(current.text)) {
            continue;
          }
          seen.add(current.text);
          triedCandidates += 1;

          try {
            await api.parseMermaidToExcalidraw(current.text);
            if (!cancelled) {
              autoFixCandidate = current.text;
            }
            return;
          } catch (candidateError) {
            if (current.depth >= AUTO_FIX_MAX_DEPTH) {
              continue;
            }
            const nextErrorMessage = getErrorMessage(candidateError);
            if (!nextErrorMessage) {
              continue;
            }
            const nextCandidates = getMermaidAutoFixCandidates(
              current.text,
              nextErrorMessage,
            );
            for (const nextCandidate of nextCandidates) {
              if (!seen.has(nextCandidate)) {
                queue.push({
                  text: nextCandidate,
                  depth: current.depth + 1,
                });
              }
            }
          }
        }
      } catch {
        // ignore auto-fix probe errors
      }
      if (!cancelled) {
        autoFixCandidate = null;
      }
    }, AUTO_FIX_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  });

  const onInsertToEditor = () => {
    insertToEditor({
      app: editor.app,
      data,
      text,
      shouldSaveMermaidDataToStorage: true,
    });
  };

  const onApplyAutoFix = () => {
    if (!autoFixCandidate) {
      return;
    }
    text = autoFixCandidate;
  };
</script>

{#snippet flowchartLink(el: Snippet)}
  <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noreferrer">{@render el()}</a>
{/snippet}
{#snippet sequenceLink(el: Snippet)}
  <a href="https://mermaid.js.org/syntax/sequenceDiagram.html" target="_blank" rel="noreferrer">{@render el()}</a>
{/snippet}
{#snippet classLink(el: Snippet)}
  <a href="https://mermaid.js.org/syntax/classDiagram.html" target="_blank" rel="noreferrer">{@render el()}</a>
{/snippet}
{#snippet erdLink(el: Snippet)}
  <a href="https://mermaid.js.org/syntax/entityRelationshipDiagram.html" target="_blank" rel="noreferrer">{@render el()}</a>
{/snippet}

<div class="ttd-dialog-desc">
  <Trans
    i18nKey="mermaid.description"
    {flowchartLink}
    {sequenceLink}
    {classLink}
    {erdLink}
  />
</div>
<TTDDialogPanels>
  <TTDDialogPanel>
    <TTDDialogInput
      input={text}
      placeholder={t("mermaid.inputPlaceholder")}
      onChange={(value) => (text = value)}
      {errorLine}
      onKeyboardSubmit={() => {
        onInsertToEditor();
      }}
    />
  </TTDDialogPanel>
  <TTDDialogPanel
    panelActions={[
      {
        action: () => {
          onInsertToEditor();
        },
        label: t("mermaid.button"),
        icon: ArrowRightIcon,
        variant: "button",
      },
    ]}
  >
    {#snippet renderSubmitShortcut()}
      <TTDDialogSubmitShortcut />
    {/snippet}
    <TTDDialogOutput
      bind:canvasEl
      loadStatus={mermaidToExcalidrawLib.status}
      loadErrorReloadRequired={mermaidToExcalidrawLib.reloadRequired}
      {onRetryLoad}
      {error}
      sourceText={text}
      autoFixAvailable={!!autoFixCandidate}
      {onApplyAutoFix}
    />
  </TTDDialogPanel>
</TTDDialogPanels>
