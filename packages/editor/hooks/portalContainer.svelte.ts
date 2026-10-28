import { EVENT, THEME } from "@svelte-draw/common";

import { getEditorContext } from "../ui/editorContext";

/**
 * Creates a `div` in the editor's owner document (or inside
 * `parentSelector` within the editor container), styled with the `excalidraw`
 * classes, and exposes it reactively (replaces `useCreatePortalContainer`).
 * Call during component initialization; pair with `{@attach portal(div)}`.
 *
 * `opts` may be a getter if the options can change.
 */
export const createPortalContainer = (
  opts?:
    | { className?: string; parentSelector?: string }
    | (() => { className?: string; parentSelector?: string } | undefined),
) => {
  const ctx = getEditorContext();
  const getOpts = () => (typeof opts === "function" ? opts() : opts);

  let div = $state.raw<HTMLDivElement | null>(null);

  // create/destroy the element (was a layout effect keyed on the container
  // and `parentSelector`)
  $effect.pre(() => {
    const excalidrawContainer = ctx.container;
    const parentSelector = getOpts()?.parentSelector;
    const ownerDocument = excalidrawContainer?.ownerDocument;
    const container = parentSelector
      ? excalidrawContainer?.querySelector(parentSelector)
      : ownerDocument?.body;

    if (!container || !ownerDocument) {
      return;
    }

    const created = ownerDocument.createElement("div");

    container.appendChild(created);

    // outside the editor container (whose own listeners cover it), so don't
    // let a file dropped on e.g. a modal make the browser open it
    const onFileDrag = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "none";
      }
    };
    if (!parentSelector) {
      created.addEventListener(EVENT.DRAG_OVER, onFileDrag);
      created.addEventListener(EVENT.DROP, onFileDrag);
    }

    div = created;

    return () => {
      created.removeEventListener(EVENT.DRAG_OVER, onFileDrag);
      created.removeEventListener(EVENT.DROP, onFileDrag);
      container.removeChild(created);
      if (div === created) {
        div = null;
      }
    };
  });

  // keep the classes in sync (was a layout effect keyed on theme/formFactor)
  $effect.pre(() => {
    const current = div;
    const className = getOpts()?.className;
    const isPhone = ctx.editorInterface.formFactor === "phone";
    const isDark = ctx.appState.theme === THEME.DARK;
    if (current) {
      current.className = "";
      current.classList.add("excalidraw", ...(className?.split(/\s+/) || []));
      current.classList.toggle("excalidraw--mobile", isPhone);
      current.classList.toggle("theme--dark", isDark);
    }
  });

  return {
    get div() {
      return div;
    },
  };
};
