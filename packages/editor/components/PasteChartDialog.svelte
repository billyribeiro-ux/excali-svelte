<script lang="ts">
  import { newTextElement } from "@svelte-draw/element";

  import type { ChartType } from "@svelte-draw/element/types";

  import { trackEvent } from "../analytics";
  import { isSpreadsheetValidForChartType } from "../charts";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import ChartPreviewBtn from "./ChartPreviewBtn.svelte";
  import Dialog from "./Dialog.svelte";
  import Icon from "./Icon.svelte";
  import PlainTextPreviewBtn from "./PlainTextPreviewBtn.svelte";

  import "./PasteChartDialog.scss";

  import { bucketFillIcon } from "./icons";

  import type { ChartElements, Spreadsheet } from "../charts";

  type Props = {
    data: Spreadsheet;
    rawText: string;
    onClose: () => void;
  };

  let { data, rawText, onClose }: Props = $props();

  const ctx = getEditorContext();

  let colorSeed = $state(Math.random());

  const handleReshuffleColors = () => {
    colorSeed = Math.random();
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleChartClick = (chartType: ChartType, elements: ChartElements) => {
    ctx.app.onInsertElements(elements);
    trackEvent("paste", "chart", chartType);
    onClose();
    ctx.app.focusContainer();
  };

  const handlePlainTextClick = (text: string) => {
    const textElement = newTextElement({
      text,
      x: 0,
      y: 0,
      renderEnvironment: ctx.app.renderEnvironment,
    });
    ctx.app.onInsertElements([textElement]);
    trackEvent("paste", "chart", "plaintext");
    onClose();
    ctx.app.focusContainer();
  };

  const chartTypes = $derived(
    (["bar", "line", "radar"] as const).filter((chartType) =>
      isSpreadsheetValidForChartType(data, chartType),
    ),
  );
</script>

{#snippet title()}
  <div class="PasteChartDialog__title">
    <div class="PasteChartDialog__titleText">
      {t("labels.pasteCharts")}
    </div>
    <div
      class="PasteChartDialog__reshuffleBtn"
      onclick={handleReshuffleColors}
      role="button"
      tabindex="0"
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleReshuffleColors();
        }
      }}
    >
      <Icon icon={bucketFillIcon} />
    </div>
  </div>
{/snippet}

<Dialog
  size="regular"
  onCloseRequest={handleClose}
  {title}
  class="PasteChartDialog"
  autofocus={false}
>
  <div class="container">
    {#each chartTypes as chartType (chartType)}
      <ChartPreviewBtn
        {chartType}
        spreadsheet={data}
        {colorSeed}
        onInsert={handleChartClick}
      />
    {/each}
    {#if rawText}
      <PlainTextPreviewBtn {rawText} onInsert={handlePlainTextClick} />
    {/if}
  </div>
</Dialog>
