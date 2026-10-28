<script lang="ts">
  import { t } from "../../i18n";
  import { ArrowRightIcon } from "../icons";

  import TTDDialogOutput from "./TTDDialogOutput.svelte";
  import TTDDialogPanel from "./TTDDialogPanel.svelte";

  import type { TTDPanelAction } from "./TTDDialogPanel.svelte";
  import type { MermaidToExcalidrawLibProps } from "./types";

  interface Props {
    canvasEl?: HTMLDivElement | null;
    error: Error | null;
    loadStatus: MermaidToExcalidrawLibProps["status"];
    loadErrorReloadRequired?: boolean;
    onRetryLoad?: () => void;
    onInsert: () => void;
    hideErrorDetails?: boolean;
  }

  let {
    canvasEl = $bindable(null),
    error,
    loadStatus,
    loadErrorReloadRequired,
    onRetryLoad,
    onInsert,
    hideErrorDetails,
  }: Props = $props();

  const actions: TTDPanelAction[] = $derived([
    {
      action: onInsert,
      label: t("chat.insert"),
      icon: ArrowRightIcon,
      variant: "button",
    },
  ]);
</script>

<TTDDialogPanel
  panelActionJustifyContent="flex-end"
  panelActions={actions}
  class="ttd-dialog-preview-panel"
>
  <TTDDialogOutput
    bind:canvasEl
    {error}
    {loadStatus}
    {loadErrorReloadRequired}
    {onRetryLoad}
    {hideErrorDetails}
  />
</TTDDialogPanel>
