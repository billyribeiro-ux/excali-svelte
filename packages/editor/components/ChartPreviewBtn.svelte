<script lang="ts">
  import type { ChartType } from "@svelte-draw/element/types";

  import { renderSpreadsheet } from "../charts";
  import { t } from "../i18n";
  import { exportScene } from "../scene/export";
  import { getEditorContext } from "../ui/editorContext";

  import type { ChartElements, Spreadsheet } from "../charts";

  type Props = {
    spreadsheet: Spreadsheet | null;
    chartType: ChartType;
    colorSeed: number;
    onInsert: (chartType: ChartType, elements: ChartElements) => void;
  };

  let { spreadsheet, chartType, colorSeed, onInsert }: Props = $props();

  const ctx = getEditorContext();

  let previewNode: HTMLDivElement | undefined = $state();

  const chartElements = $derived(
    spreadsheet
      ? renderSpreadsheet(
          chartType,
          spreadsheet,
          0,
          0,
          colorSeed,
          ctx.app.renderEnvironment,
        )
      : null,
  );

  $effect(() => {
    const node = previewNode;
    const elements = chartElements;
    const theme = ctx.appState.theme;
    const environment = ctx.app.renderEnvironment;

    if (!node || !elements) {
      node?.replaceChildren();
      return;
    }

    let cancelled = false;
    (async () => {
      const svg = await exportScene({
        type: "svg",
        data: {
          elements,
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

  const label = $derived.by(() => {
    switch (chartType) {
      case "bar":
        return t("labels.chartType_bar");
      case "line":
        return t("labels.chartType_line");
      case "radar":
        return t("labels.chartType_radar");
      default:
        return chartType;
    }
  });
</script>

<button
  type="button"
  class="ChartPreview"
  aria-label={label}
  onclick={() => {
    if (chartElements) {
      onInsert(chartType, chartElements);
    }
  }}
>
  <div class="ChartPreview__canvas" bind:this={previewNode}></div>
  <div class="ChartPreview__label">{label}</div>
</button>
