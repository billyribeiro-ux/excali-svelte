import { CLASSES } from "@svelte-draw/common";

// re-exported for consumers outside the styles panel (e.g. CommandPalette)
export {
  canChangeStrokeColor,
  canChangeBackgroundColor,
} from "./shapeActionPredicates";

/** class of the combined/compact properties popover content */
export const PROPERTIES_CLASSES = [
  CLASSES.SHAPE_ACTIONS_THEME_SCOPE,
  "properties-content",
].join(" ");
