import { KEYS } from "@svelte-draw/common";

export const DEFAULT_CATEGORIES = {
  app: "App",
  export: "Export",
  tools: "Tools",
  editor: "Editor",
  elements: "Elements",
  links: "Links",
  library: "Library",
};

export const getCategoryOrder = (category: string) => {
  switch (category) {
    case DEFAULT_CATEGORIES.app:
      return 1;
    case DEFAULT_CATEGORIES.export:
      return 2;
    case DEFAULT_CATEGORIES.editor:
      return 3;
    case DEFAULT_CATEGORIES.tools:
      return 4;
    case DEFAULT_CATEGORIES.elements:
      return 5;
    case DEFAULT_CATEGORIES.links:
      return 6;
    default:
      return 10;
  }
};

export const isCommandPaletteToggleShortcut = (event: KeyboardEvent) => {
  return (
    !event.altKey &&
    event[KEYS.CTRL_OR_CMD] &&
    ((event.shiftKey && event.key.toLowerCase() === KEYS.P) ||
      event.key === KEYS.SLASH)
  );
};
