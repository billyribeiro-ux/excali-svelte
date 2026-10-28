import CommandPaletteComponent from "./CommandPalette.svelte";
import * as defaultItems from "./defaultCommandPaletteItems";

export { DEFAULT_CATEGORIES, getCategoryOrder } from "./categories";
export { defaultItems };

/**
 * The palette component, with `CommandPalette.defaultItems` attached like the
 * React original.
 */
export const CommandPalette = Object.assign(CommandPaletteComponent, {
  defaultItems,
});
