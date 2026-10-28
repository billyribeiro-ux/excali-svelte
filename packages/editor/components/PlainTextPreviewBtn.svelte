<script lang="ts">
  import { newTextElement } from "@svelte-draw/element";

  import { t } from "../i18n";
  import { exportScene } from "../scene/export";
  import { getEditorContext } from "../ui/editorContext";

  type Props = {
    rawText: string;
    onInsert: (rawText: string) => void;
  };

  let { rawText, onInsert }: Props = $props();

  const ctx = getEditorContext();

  let previewNode: HTMLDivElement | undefined = $state();

  $effect(() => {
    const node = previewNode;
    const text = rawText;
    const theme = ctx.appState.theme;
    const environment = ctx.app.renderEnvironment;

    if (!node || !text) {
      return;
    }

    const textElement = newTextElement({
      text,
      x: 0,
      y: 0,
    });

    let cancelled = false;
    (async () => {
      const svg = await exportScene({
        type: "svg",
        data: {
          elements: [textElement],
          files: null,
        },
        config: {
          skipInliningFonts: true,
          theme,
          canvasBackgroundColor: false,
          environment,
        },
      });
      if (cancelled) {
        return;
      }
      svg.querySelector(".style-fonts")?.remove();
      node.replaceChildren();
      node.appendChild(svg);
    })();

    return () => {
      cancelled = true;
      node.replaceChildren();
    };
  });
</script>

<button
  type="button"
  class="ChartPreview"
  aria-label={t("labels.chartType_plaintext")}
  onclick={() => {
    onInsert(rawText);
  }}
>
  <div class="ChartPreview__canvas" bind:this={previewNode}></div>
  <div class="ChartPreview__label">{t("labels.chartType_plaintext")}</div>
</button>
