import { exportScene } from "../scene/export";
import { atom, editorJotaiStore } from "../editor-jotai";

import type { Attachment } from "svelte/attachments";

import type { LibraryItem } from "../types";

export type SvgCache = Map<LibraryItem["id"], SVGSVGElement>;

export const libraryItemSvgsCache = atom<SvgCache>(new Map());

const exportLibraryItemToSvg = async (elements: LibraryItem["elements"]) => {
  return await exportScene({
    type: "svg",
    data: {
      elements,
      files: null,
    },
    config: {
      skipInliningFonts: true,
      canvasBackgroundColor: false,
    },
  });
};

/**
 * Exports a library item to an SVG (cached by `id` in `svgCache`) and exposes
 * it reactively (replaces `useLibraryItemSvg`). Call during component
 * initialization.
 *
 * - `input` is read reactively; the export re-runs when it changes.
 * - `svg` is the current SVG (or `undefined` while pending).
 * - `attachment` goes on the container element (`{@attach item.attachment}`);
 *   it renders the svg into it and clears it on teardown.
 */
export const createLibraryItemSvg = (
  input: () => {
    id: LibraryItem["id"] | null;
    elements: LibraryItem["elements"] | undefined;
    svgCache: SvgCache;
  },
) => {
  let svg = $state.raw<SVGSVGElement>();

  $effect(() => {
    const { id, elements, svgCache } = input();
    let cancelled = false;

    if (elements) {
      if (id) {
        // Try to load cached svg
        const cachedSvg = svgCache.get(id);

        if (cachedSvg) {
          svg = cachedSvg;
        } else {
          // When there is no svg in cache export it and save to cache
          (async () => {
            const exportedSvg = await exportLibraryItemToSvg(elements);
            // TODO: should likely be removed for custom fonts
            exportedSvg.querySelector(".style-fonts")?.remove();

            if (exportedSvg) {
              svgCache.set(id, exportedSvg);
              if (!cancelled) {
                svg = exportedSvg;
              }
            }
          })();
        }
      } else {
        // When we have no id (usualy selected items from canvas) just export the svg
        (async () => {
          const exportedSvg = await exportLibraryItemToSvg(elements);
          if (!cancelled) {
            svg = exportedSvg;
          }
        })();
      }
    }

    return () => {
      cancelled = true;
    };
  });

  const attachment: Attachment<HTMLDivElement> = (node) => {
    if (svg) {
      node.innerHTML = svg.outerHTML;
    }

    return () => {
      node.innerHTML = "";
    };
  };

  return {
    get svg() {
      return svg;
    },
    attachment,
  };
};

/** non-reactive accessors for the shared library svg cache */
export const useLibraryCache = () => {
  const svgCache = editorJotaiStore.peek(libraryItemSvgsCache);

  const clearLibraryCache = () => svgCache.clear();

  const deleteItemsFromLibraryCache = (items: LibraryItem["id"][]) => {
    items.forEach((item) => svgCache.delete(item));
  };

  return {
    clearLibraryCache,
    deleteItemsFromLibraryCache,
    svgCache,
  };
};
