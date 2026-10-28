<script lang="ts">
  import { exportScene } from "../../scene/export";
  import { editorJotaiStore } from "../../editor-jotai";
  import { libraryItemSvgsCache } from "../../hooks/libraryItemSvg.svelte";

  import type { LibraryItem } from "../../types";

  type Props = {
    id: LibraryItem["id"] | null;
    elements: LibraryItem["elements"] | undefined;
  };

  let { id, elements }: Props = $props();

  let svg = $state.raw<SVGSVGElement | undefined>();

  const exportToSvg = (items: NonNullable<Props["elements"]>) =>
    exportScene({
      type: "svg",
      data: { elements: items, files: null },
      config: { skipInliningFonts: true, canvasBackgroundColor: false },
    });

  // loads the svg of the library item, going through the shared svg cache
  // (same strategy as `useLibraryItemSvg`)
  $effect(() => {
    const currentId = id;
    const currentElements = elements;
    let cancelled = false;

    if (!currentElements) {
      return;
    }

    const cache = editorJotaiStore.peek(libraryItemSvgsCache);
    const cached = currentId ? cache.get(currentId) : undefined;

    if (cached) {
      svg = cached;
      return;
    }

    (async () => {
      const exported = await exportToSvg(currentElements);
      if (currentId) {
        // TODO: should likely be removed for custom fonts
        exported.querySelector(".style-fonts")?.remove();
        cache.set(currentId, exported);
      }
      if (!cancelled) {
        svg = exported;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const renderSvg = (node: HTMLDivElement) => {
    if (svg) {
      node.innerHTML = svg.outerHTML;
    }
    return () => {
      node.innerHTML = "";
    };
  };
</script>

<div class="library-item-icon" {@attach renderSvg}></div>
