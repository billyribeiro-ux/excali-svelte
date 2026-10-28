import type { ActionManager } from "../../actions/manager";
import type { Action } from "../../actions/types";
import type { LibraryItem } from "../../types";

export type CommandPaletteItem = {
  label: string;
  /** additional keywords to match against
   * (appended to haystack, not displayed) */
  keywords?: string[];
  /**
   * string we should match against when searching
   * (deburred name + keywords)
   */
  haystack?: string;
  icon?: Action["icon"];
  /**
   * renders the (cached) svg preview of a library item in place of `icon`
   */
  libraryIcon?: {
    id: LibraryItem["id"] | null;
    elements: LibraryItem["elements"] | undefined;
  };
  category: string;
  order?: number;
  predicate?: boolean | Action["predicate"];
  shortcut?: string | null;
  /** if false, command will not show while in view mode */
  viewMode?: boolean;
  perform: (data: {
    actionManager: ActionManager;
    event: MouseEvent | KeyboardEvent;
  }) => void;
};
