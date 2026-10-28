import { getContext, setContext } from "svelte";

import { colorToHex, isTransparent } from "@svelte-draw/common";

import { createTopPicksDnD } from "../TopPicksDnD/topPicksDnD.svelte";

import type {
  CreateTopPicksGhost,
  TopPicksDnD,
} from "../TopPicksDnD/topPicksDnD.svelte";

/** value-equality of colors — normalizes notation (`#fff` vs `#ffffff` vs
 * `white`) so visually identical colors can't occupy multiple pick slots */
const isSameColor = (a: string, b: string) => {
  if (a.toLowerCase() === b.toLowerCase()) {
    return true;
  }
  const aHex = colorToHex(a);
  return aHex !== null && aHex === colorToHex(b);
};

const createColorGhost: CreateTopPicksGhost<string> = ({
  value: color,
  sourceEl,
}) => {
  // the source may live in another window's document (e.g. a popout)
  const ownerDocument = sourceEl.ownerDocument;
  const swatch = ownerDocument.createElement("div");
  swatch.className = "excalidraw-color-dnd-ghost-swatch";
  if (isTransparent(color)) {
    swatch.classList.add("is-transparent");
  } else {
    // swatches render the theme-adjusted color (dark mode remaps colors
    // rather than CSS-filtering them) — sample the rendered color so the
    // ghost matches what the user picked up
    const rendered = (ownerDocument.defaultView ?? window).getComputedStyle(
      sourceEl,
    ).backgroundColor;
    swatch.style.backgroundColor =
      rendered && rendered !== "rgba(0, 0, 0, 0)" ? rendered : color;
  }
  return { content: swatch, rect: sourceEl.getBoundingClientRect() };
};

export type ColorPickerDnD = TopPicksDnD<string>;

const COLOR_PICKER_DND_KEY = Symbol("colorPickerDnD");

/** provide the drag & drop controller to the picker subtree. The getter
 * returns `null` while the top picks are not customizable; read it through
 * `getColorPickerDnD().current` inside `$derived`/templates */
export const setColorPickerDnD = (get: () => ColorPickerDnD | null) =>
  setContext(COLOR_PICKER_DND_KEY, {
    get current() {
      return get();
    },
  });

/** the (reactive) controller provided by an ancestor `ColorPicker`; `current`
 * is `null` when the top picks are not customizable or there is no ancestor */
export const getColorPickerDnD = (): {
  readonly current: ColorPickerDnD | null;
} =>
  getContext<{ readonly current: ColorPickerDnD | null } | undefined>(
    COLOR_PICKER_DND_KEY,
  ) ?? { current: null };

/** pinning colors from the picker popup (palette/shades/custom) or the
 * active-color trigger to the top-picks strip, and reordering the strip.
 * `getOptions` is read on every use — close over reactive props. The owner
 * must `destroy()` it. */
export const createColorTopPicksDnD = (
  getOptions: () => {
    enabled: boolean;
    picks: readonly string[];
    onPicksChange: (picks: string[]) => void;
  },
): ColorPickerDnD =>
  createTopPicksDnD<string>(() => ({
    ...getOptions(),
    isSamePick: isSameColor,
    createGhost: createColorGhost,
  }));
