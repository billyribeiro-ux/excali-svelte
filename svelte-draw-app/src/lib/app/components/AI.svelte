<script lang="ts">
  import {
    DiagramToCodePlugin,
    exportScene,
    getNonDeletedElements,
    getTextFromElements,
    parseSSEStream,
    TTDDialog,
    TTDStreamFetch,
    THEME,
  } from "@svelte-draw/editor";
  import { getDataURL } from "@svelte-draw/editor/data/blob";
  import { safelyParseJSON } from "@svelte-draw/common";

  import { AI_BACKEND_URL } from "#lib/app/app_config.ts";
  import { TTDIndexedDBAdapter } from "#lib/app/data/TTDStorage.ts";

  import type { StreamChunk } from "@svelte-draw/editor";
  import type {
    SvelteDrawAPI,
    GenerateDiagramToCode,
  } from "@svelte-draw/editor/types";
  import type { TTTDDialog } from "@svelte-draw/editor/components/TTDDialog/types";

  let { excalidrawAPI }: { excalidrawAPI: SvelteDrawAPI } = $props();

  const generate: GenerateDiagramToCode = async ({
    frame,
    children,
    onPartial,
  }) => {
    const appState = excalidrawAPI.getAppState();

    // SAFETY: This should never happen, but log it just in case
    if (children.some((el) => el.isDeleted)) {
      console.error(
        "[NONDELETED][INVARIANT] Generated children elements should not be `isDeleted: true`",
      );
    }

    const blob = await exportScene({
      type: "jpeg",
      data: {
        elements: getNonDeletedElements(children),
        appState,
        files: excalidrawAPI.getFiles(),
      },
      config: {
        exportingFrame: frame,
        theme: appState.exportWithDarkMode ? THEME.DARK : THEME.LIGHT,
      },
    });

    const dataURL = await getDataURL(blob);

    const textFromFrameChildren = getTextFromElements(children);

    const response = await fetch(
      `${AI_BACKEND_URL}/v1/ai/diagram-to-code/generate-streaming`,
      {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: textFromFrameChildren,
          image: dataURL,
          theme: appState.theme,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      const errorJSON = safelyParseJSON(text);

      if (!errorJSON) {
        throw new Error(text);
      }

      if (errorJSON.statusCode === 429) {
        return {
          html: `<html>
          <body style="margin: 0; text-align: center">
          <div style="display: flex; align-items: center; justify-content: center; flex-direction: column; height: 100vh; padding: 0 60px">
            <div style="color:red">Too many requests today,</br>please try again tomorrow!</div>
          </div>
          </body>
          </html>`,
        };
      }

      throw new Error(errorJSON.message || text);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("Generation failed (invalid response)");
    }

    let html = "";
    let streamError: Error | null = null;

    for await (const data of parseSSEStream(reader)) {
      if (data === "[DONE]") {
        break;
      }

      const chunk = safelyParseJSON(data) as StreamChunk | null;

      if (!chunk) {
        continue;
      }

      switch (chunk.type) {
        case "content": {
          if (chunk.delta) {
            html += chunk.delta;
            onPartial?.(html);
          }
          break;
        }
        case "error": {
          streamError = new Error(
            chunk.error.message || "Generation failed",
          );
          break;
        }
        case "done": {
          break;
        }
      }
    }

    if (streamError) {
      throw streamError;
    }

    if (!html.trim()) {
      throw new Error("Generation failed (invalid response)");
    }

    return {
      html,
    };
  };

  const onTextSubmit: TTTDDialog.onTextSubmit = async (props) => {
    const { onChunk, onStreamCreated, signal, messages } = props;

    const result = await TTDStreamFetch({
      url: `${AI_BACKEND_URL}/v1/ai/text-to-diagram/chat-streaming`,
      messages,
      onChunk,
      onStreamCreated,
      extractRateLimits: true,
      signal,
    });

    return result;
  };
</script>

<DiagramToCodePlugin {generate} />

<TTDDialog {onTextSubmit} persistenceAdapter={TTDIndexedDBAdapter} />
