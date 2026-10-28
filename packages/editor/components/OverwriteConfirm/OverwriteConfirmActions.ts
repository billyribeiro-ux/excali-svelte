import ActionComponent from "./Actions/Action.svelte";
import ActionsComponent from "./Actions/Actions.svelte";
import ExportToImage from "./Actions/ExportToImage.svelte";
import SaveToDisk from "./Actions/SaveToDisk.svelte";

export type { ActionProps } from "./Actions/Action.svelte";

export { ExportToImage, SaveToDisk };
export const Action = ActionComponent;

/** `<Actions>` wrapper with `.ExportToImage` / `.SaveToDisk` parts */
export const Actions = Object.assign(ActionsComponent, {
  ExportToImage,
  SaveToDisk,
});
