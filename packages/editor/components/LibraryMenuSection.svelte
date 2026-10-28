<script lang="ts">
  import EmptyLibraryUnit from "./EmptyLibraryUnit.svelte";
  import LibraryUnit from "./LibraryUnit.svelte";

  import type { ExcalidrawElement, NonDeleted } from "@svelte-draw/element/types";

  import type { SvgCache } from "../hooks/libraryItemSvg.svelte";
  import type { LibraryItem } from "../types";

  type LibraryOrPendingItem = readonly (
    | LibraryItem
    | /* pending library item */ {
        id: null;
        elements: readonly NonDeleted<ExcalidrawElement>[];
      }
  )[];

  type Props = {
    items: LibraryOrPendingItem;
    onClick: (id: LibraryItem["id"] | null) => void;
    onItemSelectToggle: (id: LibraryItem["id"], event: MouseEvent) => void;
    onItemDrag: (id: LibraryItem["id"], event: DragEvent) => void;
    isItemSelected: (id: LibraryItem["id"] | null) => boolean;
    svgCache: SvgCache;
    itemsRenderedPerBatch: number;
    /** larger items with their name below */
    showNames?: boolean;
  };

  let {
    items,
    onItemSelectToggle,
    onItemDrag,
    isItemSelected,
    onClick,
    svgCache,
    itemsRenderedPerBatch,
    showNames,
  }: Props = $props();

  // items are rendered progressively, batch by batch, so that opening a large
  // library doesn't block the main thread
  let index = $state(0);

  $effect(() => {
    if (index < items.length) {
      const timer = setTimeout(() => {
        index += itemsRenderedPerBatch;
      });
      return () => clearTimeout(timer);
    }
  });
</script>

{#each items as item, i (item?.id ?? i)}
  {#if i < index}
    <LibraryUnit
      elements={item?.elements}
      isPending={!item?.id && !!item?.elements}
      {onClick}
      {svgCache}
      id={item?.id}
      name={"name" in item ? item.name : undefined}
      showName={showNames}
      selected={isItemSelected(item.id)}
      onToggle={onItemSelectToggle}
      onDrag={onItemDrag}
    />
  {:else}
    <EmptyLibraryUnit showName={showNames} />
  {/if}
{/each}
