import { createContext } from "svelte";

import { composeEventHandlers } from "@svelte-draw/common";

/**
 * Provided by `<DropdownMenuContent>` so that every item can notify the menu
 * that it was selected (`onSelect` prop of the content).
 */
export type DropdownMenuContentPropsContextValue = {
  readonly onSelect?: (event: Event) => void;
};

export const [
  getDropdownMenuContentProps,
  setDropdownMenuContentProps,
  hasDropdownMenuContentProps,
] = createContext<DropdownMenuContentPropsContextValue>();

/**
 * Provided by `<DropdownMenu>` (replaces cloning the Content element with the
 * `open` prop in the React version).
 */
export type DropdownMenuStateContextValue = { readonly open: boolean };

export const [getDropdownMenuState, setDropdownMenuState] =
  createContext<DropdownMenuStateContextValue>();

export const DropDownMenuItemBadgeType = {
  GREEN: "green",
  RED: "red",
  BLUE: "blue",
} as const;

export const getDropdownMenuItemClassName = (
  className = "",
  selected = false,
  hovered = false,
) => {
  return `dropdown-menu-item dropdown-menu-item-base ${className} ${
    selected ? "dropdown-menu-item--selected" : ""
  } ${hovered ? "dropdown-menu-item--hovered" : ""}`.trim();
};

/**
 * Must be called during component initialization (reads the content context).
 * `getOnSelect` is read lazily so prop changes are picked up.
 */
export const createDropdownMenuItemSelectHandler = (
  getOnSelect: () => ((event: Event) => void) | undefined,
) => {
  const contentProps = hasDropdownMenuContentProps()
    ? getDropdownMenuContentProps()
    : null;

  return (event: Event) =>
    composeEventHandlers(getOnSelect(), (event: Event) => {
      contentProps?.onSelect?.(event);
    })(event);
};
