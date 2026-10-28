import { KEYS, capitalizeString } from "@svelte-draw/common";

import { t } from "../i18n";
import { getShortcutKey } from "../shortcut";

import {
  SelectionIcon,
  RectangleIcon,
  DiamondIcon,
  EllipseIcon,
  ArrowIcon,
  LineIcon,
  FreedrawIcon,
  drawShapeToolIcon,
  TextIcon,
  ImageIcon,
  EraserIcon,
  laserPointerToolIcon,
  bucketFillIcon,
  LassoIcon,
  handIcon,
  frameToolIcon,
  EmbedIcon,
  stickyNoteToolIcon,
} from "./icons";

import type { IconDef } from "./icons";
import type { PointerType } from "@svelte-draw/element/types";
import type { AppClassProperties, ToolType, UIAppState } from "../types";

export type ToolConfig = {
  icon: IconDef;
  /** letter shortcut(s) — the first one is shown in tooltips and badges */
  letterKey?: string | readonly string[];
  /** whether `letterKey` requires Shift to be held (e.g. Shift+X) */
  shiftKey?: boolean;
  numericKey?: string;
  /** whether the tool's shapes can be filled — fills the icon when active */
  fillable?: boolean;
  /**
   * re-activating the tool switches back to the previously active tool
   * (via the keyboard shortcut or ESC — see `setActiveTool`'s `toggle`
   * option)
   */
  toggle?: boolean;
};

/** preserves the exact keys while typing every entry as ToolConfig */
const defineTools = <T extends Record<string, ToolConfig>>(tools: T) =>
  tools as { [K in keyof T]: ToolConfig };

/**
 * Tool data — the single source of truth for tool buttons, keyboard
 * shortcuts (`findShapeByKey`), and the command palette. Toolbar placement
 * is not defined here: toolbars compose the `*ToolButton` components below
 * manually, so entries without a toolbar slot (e.g. laser) are data-only.
 */
export const TOOLS = defineTools({
  hand: {
    icon: handIcon,
    letterKey: KEYS.H,
    toggle: true,
  },
  selection: {
    icon: SelectionIcon,
    letterKey: KEYS.V,
    numericKey: KEYS["1"],
    fillable: true,
  },
  rectangle: {
    icon: RectangleIcon,
    letterKey: KEYS.R,
    numericKey: KEYS["2"],
    fillable: true,
  },
  diamond: {
    icon: DiamondIcon,
    letterKey: KEYS.D,
    numericKey: KEYS["3"],
    fillable: true,
  },
  ellipse: {
    icon: EllipseIcon,
    letterKey: KEYS.O,
    numericKey: KEYS["4"],
    fillable: true,
  },
  arrow: {
    icon: ArrowIcon,
    letterKey: KEYS.A,
    numericKey: KEYS["5"],
    fillable: true,
  },
  line: {
    icon: LineIcon,
    letterKey: KEYS.L,
    numericKey: KEYS["6"],
    fillable: true,
  },
  freedraw: {
    icon: FreedrawIcon,
    letterKey: [KEYS.P, KEYS.X],
    numericKey: KEYS["7"],
  },
  text: {
    icon: TextIcon,
    letterKey: KEYS.T,
    numericKey: KEYS["8"],
  },
  stickynote: {
    icon: stickyNoteToolIcon,
    letterKey: KEYS.N,
  },
  image: {
    icon: ImageIcon,
    numericKey: KEYS["9"],
  },
  eraser: {
    icon: EraserIcon,
    letterKey: KEYS.E,
    numericKey: KEYS["0"],
    toggle: true,
  },
  frame: {
    icon: frameToolIcon,
    letterKey: KEYS.F,
  },
  autoshape: {
    icon: drawShapeToolIcon,
    letterKey: KEYS.X,
    shiftKey: true,
    fillable: false,
  },
  embeddable: {
    icon: EmbedIcon,
  },
  laser: {
    icon: laserPointerToolIcon,
    letterKey: KEYS.K,
  },
  bucketfill: {
    icon: bucketFillIcon,
    letterKey: KEYS.B,
  },
  lasso: {
    icon: LassoIcon,
    fillable: false,
  },
});

export type ToolbarToolType = keyof typeof TOOLS;

/**
 * tools that, when activated while already active, switch back to the
 * previously active tool (see `setActiveTool`'s `toggle` option)
 */
export const TOGGLE_TOOLS: readonly (ToolType | "custom")[] = (
  Object.keys(TOOLS) as ToolbarToolType[]
).filter((type) => TOOLS[type].toggle);

export const getToolLetter = (type: ToolbarToolType) => {
  const { letterKey, shiftKey } = TOOLS[type];
  if (!letterKey) {
    return letterKey;
  }
  const letter = capitalizeString(
    typeof letterKey === "string" ? letterKey : letterKey[0],
  );
  return shiftKey ? getShortcutKey(`Shift+${letter}`) : letter;
};

/** human-readable shortcut hint, e.g. "R or 2", used in tooltips & aria */
export const getToolShortcut = (type: ToolbarToolType) => {
  const letter = getToolLetter(type);
  const { numericKey } = TOOLS[type];
  return letter && numericKey != null
    ? `${letter} ${t("helpDialog.or")} ${numericKey}`
    : `${letter || numericKey}`;
};

export const findShapeByKey = (
  key: string,
  app: AppClassProperties,
  shiftKey: boolean = false,
) => {
  // CapsLock-insensitive: the caller excludes every modifier but shift, and
  // shift is matched explicitly below, so a capital letter on its own means
  // CapsLock
  const lowerKey = key.toLowerCase();

  for (const type of Object.keys(TOOLS) as ToolbarToolType[]) {
    const { letterKey, numericKey, shiftKey: requiresShift } = TOOLS[type];
    // shift-bound tools require shift; plain-bound ones require its absence
    if (shiftKey !== Boolean(requiresShift)) {
      continue;
    }
    if (
      (numericKey != null && key === numericKey) ||
      (letterKey &&
        (typeof letterKey === "string"
          ? letterKey === lowerKey
          : letterKey.includes(lowerKey)))
    ) {
      // the selection shortcut activates whichever selection tool the user
      // prefers (selection or lasso)
      return type === "selection"
        ? app.state.preferredSelectionTool.type
        : type;
    }
  }
  return null;
};

/**
 * Whether a toolbar entry activating the given tool renders disabled — true
 * when the active tool is host-controlled (`props.activeTool`) and the entry
 * doesn't activate the forced tool (`setActiveTool` refuses it).
 */
export const isToolButtonDisabled = (app: AppClassProperties, type: string) =>
  app.props.activeTool != null && app.props.activeTool.type !== type;

export type ToolButtonComponentProps = {
  app: AppClassProperties;
  activeTool: UIAppState["activeTool"];
  /** hide the keybinding badge rendered in the button's corner */
  hideKeyBinding?: boolean;
  /**
   * hide all shortcut affordances (tooltip hint, aria-keyshortcuts, and the
   * keybinding badge) — used on mobile where there's no keyboard
   */
  hideShortcut?: boolean;
};

export type ToolButtonBehavior = {
  /**
   * display the shortcut of another tool (tooltip, aria, keybinding badge) —
   * e.g. the lasso button shows the selection shortcut, which activates it
   * when lasso is the preferred selection tool
   */
  shortcutType?: ToolbarToolType;
  /**
   * custom activation — replaces the default track + `setActiveTool` (pen
   * detection still runs before it)
   */
  onSelect?: (
    app: AppClassProperties,
    data: { pointerType: PointerType | null },
  ) => void;
};
