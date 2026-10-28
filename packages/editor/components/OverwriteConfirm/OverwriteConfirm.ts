import { Action, Actions } from "./OverwriteConfirmActions";
import OverwriteConfirmDialogComponent from "./OverwriteConfirm.svelte";

export type { OverwriteConfirmDialogProps } from "./OverwriteConfirm.svelte";

/**
 * `<OverwriteConfirmDialog>` with `.Actions` / `.Action` parts (public API
 * for host apps).
 */
export const OverwriteConfirmDialog = Object.assign(
  OverwriteConfirmDialogComponent,
  { Actions, Action },
);
