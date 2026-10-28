<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type OverwriteConfirmDialogProps = {
    children: Snippet;
  };
</script>

<script lang="ts">
  import { getTunnels } from "../../context/tunnels";
  import { useAtom } from "../../editor-jotai";
  import TunnelIn from "../../ui/TunnelIn.svelte";
  import UIContent from "../../ui/UIContent.svelte";
  import Dialog from "../Dialog.svelte";
  import FilledButton from "../FilledButton.svelte";
  import { useInternalFallback } from "../hoc/withInternalFallback.svelte";
  import Icon from "../Icon.svelte";
  import { alertTriangleIcon } from "../icons";

  import Actions from "./Actions/Actions.svelte";
  import { overwriteConfirmStateAtom } from "./OverwriteConfirmState";

  import "./OverwriteConfirm.scss";

  let {
    children,
    __fallback,
  }: OverwriteConfirmDialogProps & {
    /** @private internal, see `useInternalFallback` */
    __fallback?: boolean;
  } = $props();

  const tunnels = getTunnels();
  const fallback = useInternalFallback("OverwriteConfirmDialog", () => __fallback);
  const state = useAtom(overwriteConfirmStateAtom);
  const overwriteConfirmState = $derived(state.current);

  const deactivate = () => {
    state.current = { active: false };
  };

  const handleClose = () => {
    const current = state.current;
    if (current.active) {
      current.onClose();
    }
    deactivate();
  };

  const handleConfirm = () => {
    const current = state.current;
    if (current.active) {
      current.onConfirm();
    }
    deactivate();
  };
</script>

{#if fallback.shouldRender && overwriteConfirmState.active}
  <TunnelIn tunnel={tunnels.OverwriteConfirmDialogTunnel}>
    <Dialog onCloseRequest={handleClose} title={false} size={916}>
      <div class="OverwriteConfirm">
        <h3>{overwriteConfirmState.title}</h3>
        <div
          class="OverwriteConfirm__Description OverwriteConfirm__Description--color-{overwriteConfirmState.color}"
        >
          <div class="OverwriteConfirm__Description__icon">
            <Icon icon={alertTriangleIcon} />
          </div>
          <div><UIContent content={overwriteConfirmState.description} /></div>
          <div class="OverwriteConfirm__Description__spacer"></div>
          <FilledButton
            color={overwriteConfirmState.color}
            size="large"
            label={overwriteConfirmState.actionLabel}
            onclick={handleConfirm}
          />
        </div>
        <Actions>{@render children()}</Actions>
      </div>
    </Dialog>
  </TunnelIn>
{/if}
