<script lang="ts">
  import {
    KEYS,
    MIME_TYPES,
    arrayToMap,
    nextAnimationFrame,
  } from "@svelte-draw/common";

  import { duplicateElements } from "@svelte-draw/element";

  import { deburr } from "../deburr";
  import { editorJotaiStore } from "../editor-jotai";
  import { useLibraryCache } from "../hooks/libraryItemSvg.svelte";
  import { scrollPositionAtom, trackScrollPosition } from "../hooks/scrollPosition";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Button from "./Button.svelte";
  import LibraryMenuControlButtons from "./LibraryMenuControlButtons.svelte";
  import LibraryDropdownMenu from "./LibraryMenuHeaderContent.svelte";
  import LibraryMenuSection from "./LibraryMenuSection.svelte";
  import LibraryMenuSectionGrid from "./LibraryMenuSectionGrid.svelte";
  import Spinner from "./Spinner.svelte";
  import Stack from "./Stack";
  import TextField from "./TextField.svelte";

  import "./LibraryMenuItems.scss";

  import type { ExcalidrawLibraryIds } from "../data/types";
  import type {
    SvelteDrawProps,
    LibraryItem,
    LibraryItems,
    UIAppState,
  } from "../types";

  // using an odd number of items per batch so the rendering creates an
  // irregular pattern which looks more organic
  const ITEMS_RENDERED_PER_BATCH = 17;
  // when render outputs cached we can render many more items per batch to
  // speed it up
  const CACHED_ITEMS_RENDERED_PER_BATCH = 64;

  type Props = {
    isLoading: boolean;
    libraryItems: LibraryItems;
    pendingElements: LibraryItem["elements"];
    onInsertLibraryItems: (libraryItems: LibraryItems) => void;
    onAddToLibrary: (elements: LibraryItem["elements"]) => void;
    libraryReturnUrl: SvelteDrawProps["libraryReturnUrl"];
    theme: UIAppState["theme"];
    id: string;
    selectedItems: LibraryItem["id"][];
    onSelectItems: (id: LibraryItem["id"][]) => void;
  };

  let {
    isLoading,
    libraryItems,
    onAddToLibrary,
    onInsertLibraryItems,
    pendingElements,
    theme,
    id,
    libraryReturnUrl,
    onSelectItems,
    selectedItems,
  }: Props = $props();

  const ctx = getEditorContext();
  const { svgCache } = useLibraryCache();

  let rootEl: HTMLDivElement | undefined = $state();
  let lastSelectedItem = $state<LibraryItem["id"] | null>(null);
  let searchInputValue = $state("");

  const IS_LIBRARY_EMPTY = $derived(
    !libraryItems.length && !pendingElements.length,
  );
  const IS_SEARCHING = $derived(
    !IS_LIBRARY_EMPTY && !!searchInputValue.trim(),
  );

  const filteredItems = $derived.by(() => {
    const searchQuery = deburr(searchInputValue.trim().toLowerCase());
    if (!searchQuery) {
      return [];
    }
    return libraryItems.filter((item) => {
      const itemName = item.name || "";
      return (
        itemName.trim() && deburr(itemName.toLowerCase()).includes(searchQuery)
      );
    });
  });

  const unpublishedItems = $derived(
    libraryItems.filter((item) => item.status !== "published"),
  );
  const publishedItems = $derived(
    libraryItems.filter((item) => item.status === "published"),
  );

  const itemsRenderedPerBatch = $derived(
    svgCache.size >=
      (filteredItems.length ? filteredItems : libraryItems).length
      ? CACHED_ITEMS_RENDERED_PER_BATCH
      : ITEMS_RENDERED_PER_BATCH,
  );

  // if selection is removed (e.g. via esc), reset last selected item so that
  // subsequent shift+clicks don't select a large range
  $effect(() => {
    if (!selectedItems.length) {
      lastSelectedItem = null;
    }
  });

  // focus could be stolen by tab trigger button
  $effect(() => {
    nextAnimationFrame(() => {
      rootEl?.querySelector<HTMLInputElement>(
        ".library-menu-items-container__search input",
      )?.focus();
    });
  });

  /** restores (survives the menu remounting) & tracks the items scroll position */
  const trackScroll = (node: HTMLElement) => {
    const scroller = node.querySelector<HTMLElement>(
      ".library-menu-items-container__items",
    );
    if (!scroller) {
      return;
    }
    const scrollPosition = editorJotaiStore.peek(scrollPositionAtom);
    if (scrollPosition > 0) {
      scroller.scrollTo(0, scrollPosition);
    }
    return trackScrollPosition(scroller);
  };

  const onItemSelectToggle = (id: LibraryItem["id"], event: MouseEvent) => {
    const shouldSelect = !selectedItems.includes(id);
    const orderedItems = [...unpublishedItems, ...publishedItems];
    if (shouldSelect) {
      if (event.shiftKey && lastSelectedItem) {
        const rangeStart = orderedItems.findIndex(
          (item) => item.id === lastSelectedItem,
        );
        const rangeEnd = orderedItems.findIndex((item) => item.id === id);

        if (rangeStart === -1 || rangeEnd === -1) {
          onSelectItems([...selectedItems, id]);
          return;
        }

        const selectedItemsMap = arrayToMap(selectedItems);
        // Support both top-down and bottom-up selection by using min/max
        const minRange = Math.min(rangeStart, rangeEnd);
        const maxRange = Math.max(rangeStart, rangeEnd);
        const nextSelectedIds = orderedItems.reduce(
          (acc: LibraryItem["id"][], item, idx) => {
            if (
              (idx >= minRange && idx <= maxRange) ||
              selectedItemsMap.has(item.id)
            ) {
              acc.push(item.id);
            }
            return acc;
          },
          [],
        );
        onSelectItems(nextSelectedIds);
      } else {
        onSelectItems([...selectedItems, id]);
      }
      lastSelectedItem = id;
    } else {
      lastSelectedItem = null;
      onSelectItems(selectedItems.filter((_id) => _id !== id));
    }
  };

  const getInsertedElements = (id: string) => {
    let targetElements;
    if (selectedItems.includes(id)) {
      targetElements = libraryItems.filter((item) =>
        selectedItems.includes(item.id),
      );
    } else {
      targetElements = libraryItems.filter((item) => item.id === id);
    }
    return targetElements.map((item) => {
      return {
        ...item,
        // duplicate each library item before inserting on canvas to confine
        // ids and bindings to each library item. See #6465
        elements: duplicateElements({
          type: "everything",
          elements: item.elements,
          randomizeSeed: true,
          preserveFrameChildrenOrder: true,
        }).duplicatedElements,
      };
    });
  };

  const onItemDrag = (id: LibraryItem["id"], event: DragEvent) => {
    // we want to serialize just the ids so the operation is fast and there's
    // no race condition if people drop the library items on canvas too fast
    const data: ExcalidrawLibraryIds = {
      itemIds: selectedItems.includes(id) ? selectedItems : [id],
    };
    event.dataTransfer!.setData(
      MIME_TYPES.excalidrawlibIds,
      JSON.stringify(data),
    );
  };

  const isItemSelected = (id: LibraryItem["id"] | null) => {
    if (!id) {
      return false;
    }
    return selectedItems.includes(id);
  };

  const onAddToLibraryClick = () => {
    onAddToLibrary(pendingElements);
  };

  const onItemClick = (id: LibraryItem["id"] | null) => {
    if (id) {
      onInsertLibraryItems(getInsertedElements(id));
    }
  };

  const pendingItems = $derived([{ id: null, elements: pendingElements }]);

  const rootStyle = $derived(
    pendingElements.length || unpublishedItems.length || publishedItems.length
      ? "justify-content: flex-start"
      : "border-bottom: 0",
  );
</script>

<div
  class="library-menu-items-container"
  style={rootStyle}
  bind:this={rootEl}
  {@attach trackScroll}
>
  <div class="library-menu-items-header">
    {#if !IS_LIBRARY_EMPTY}
      <TextField
        type="search"
        class={[
          "library-menu-items-container__search",
          { hideCancelButton: ctx.editorInterface.formFactor !== "phone" },
        ]}
        placeholder={t("library.search.inputPlaceholder")}
        value={searchInputValue}
        onChange={(value: string) => (searchInputValue = value)}
        onkeydown={(event: KeyboardEvent) => {
          // clear the search ourselves and stop the event, or the
          // sidebar's Escape listener closes an undocked sidebar
          if (event.key === KEYS.ESCAPE && searchInputValue) {
            event.preventDefault();
            event.stopPropagation();
            searchInputValue = "";
          }
        }}
      />
    {/if}
    <LibraryDropdownMenu
      {selectedItems}
      {onSelectItems}
      class="library-menu-dropdown-container--in-heading"
    />
  </div>
  <Stack.Col
    class="library-menu-items-container__items"
    align="start"
    gap={1}
    style="flex: {publishedItems.length > 0
      ? '1'
      : '0 1 auto'}; margin: {IS_LIBRARY_EMPTY ? 'auto' : '0'}"
  >
    {#if isLoading}
      <div
        style="position: absolute; top: var(--container-padding-y); right: var(--container-padding-x); transform: translateY(50%)"
      >
        <Spinner />
      </div>
    {/if}

    {#if !IS_SEARCHING}
      {#if !IS_LIBRARY_EMPTY}
        <div class="library-menu-items-container__header">
          {t("labels.personalLib")}
        </div>
      {/if}
      {#if !pendingElements.length && !unpublishedItems.length}
        <div class="library-menu-items__no-items">
          {#if !publishedItems.length}
            <div class="library-menu-items__no-items__label">
              {t("library.noItems")}
            </div>
          {/if}
          <div class="library-menu-items__no-items__hint">
            {publishedItems.length > 0
              ? t("library.hint_emptyPrivateLibrary")
              : t("library.hint_emptyLibrary")}
          </div>
        </div>
      {:else}
        <LibraryMenuSectionGrid>
          {#if pendingElements.length > 0}
            <LibraryMenuSection
              {itemsRenderedPerBatch}
              items={pendingItems}
              {onItemSelectToggle}
              {onItemDrag}
              onClick={onAddToLibraryClick}
              {isItemSelected}
              {svgCache}
            />
          {/if}
          <LibraryMenuSection
            {itemsRenderedPerBatch}
            items={unpublishedItems}
            {onItemSelectToggle}
            {onItemDrag}
            onClick={onItemClick}
            {isItemSelected}
            {svgCache}
          />
        </LibraryMenuSectionGrid>
      {/if}

      {#if publishedItems.length > 0}
        <div
          class="library-menu-items-container__header"
          style="margin-top: 0.75rem"
        >
          {t("labels.excalidrawLib")}
        </div>
        <LibraryMenuSectionGrid>
          <LibraryMenuSection
            {itemsRenderedPerBatch}
            items={publishedItems}
            {onItemSelectToggle}
            {onItemDrag}
            onClick={onItemClick}
            {isItemSelected}
            {svgCache}
          />
        </LibraryMenuSectionGrid>
      {/if}
    {:else}
      <div class="library-menu-items-container__header">
        {t("library.search.heading")}
        {#if !isLoading}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
          <div
            class="library-menu-items-container__header__hint"
            style="cursor: pointer"
            onpointerdown={(e) => e.preventDefault()}
            onclick={() => {
              searchInputValue = "";
            }}
          >
            <kbd>esc</kbd> to clear
          </div>
        {/if}
      </div>
      {#if filteredItems.length > 0}
        <LibraryMenuSectionGrid showNames>
          <LibraryMenuSection
            {itemsRenderedPerBatch}
            items={filteredItems}
            {onItemSelectToggle}
            {onItemDrag}
            onClick={onItemClick}
            {isItemSelected}
            {svgCache}
            showNames
          />
        </LibraryMenuSectionGrid>
      {:else}
        <div class="library-menu-items__no-items">
          <div class="library-menu-items__no-items__hint">
            {t("library.search.noResults")}
          </div>
          <Button
            onpointerdown={(e: PointerEvent) => e.preventDefault()}
            onSelect={() => {
              searchInputValue = "";
            }}
            style="width: auto; margin-top: 1rem"
          >
            {t("library.search.clearSearch")}
          </Button>
        </div>
      {/if}
    {/if}

    {#if IS_LIBRARY_EMPTY}
      <LibraryMenuControlButtons
        style="padding: 16px 0; width: 100%"
        {id}
        {libraryReturnUrl}
        {theme}
      />
    {/if}
  </Stack.Col>
</div>
