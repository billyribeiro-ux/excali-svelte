<script lang="ts">
  import {
    LIBRARY_DISABLED_TYPES,
    randomId,
    isShallowEqual,
    KEYS,
    isWritableElement,
    addEventListener,
    EVENT,
    CLASSES,
  } from "@svelte-draw/common";

  import { trackEvent } from "../analytics";
  import {
    distributeLibraryItemsOnSquareGrid,
    libraryItemsAtom,
  } from "../data/library";
  import { useAtom } from "../editor-jotai";
  import { t } from "../i18n";
  import { getSelectedElements } from "../scene";
  import { getEditorContext } from "../ui/editorContext";

  import LibraryMenuControlButtons from "./LibraryMenuControlButtons.svelte";
  import LibraryMenuItems from "./LibraryMenuItems.svelte";
  import Spinner from "./Spinner.svelte";

  import "./LibraryMenu.scss";

  import type {
    ExcalidrawElement,
    NonDeletedExcalidrawElement,
  } from "@svelte-draw/element/types";

  import type { LibraryItems, LibraryItem, UIAppState } from "../types";

  /**
   * This component is meant to be rendered inside <Sidebar.Tab/> inside our
   * <DefaultSidebar/> or host apps Sidebar components.
   */

  const ctx = getEditorContext();
  const libraryItemsData = useAtom(libraryItemsAtom);

  let selectedItems = $state<LibraryItem["id"][]>([]);

  const getPendingElements = (
    elements: readonly NonDeletedExcalidrawElement[],
    selectedElementIds: UIAppState["selectedElementIds"],
  ) => ({
    elements,
    pending: getSelectedElements(
      elements,
      { selectedElementIds },
      {
        includeBoundTextElement: true,
        includeElementsInFrames: true,
      },
    ),
    selectedElementIds,
  });

  // Memoized pending (selected) elements. Plain (non-reactive) bookkeeping
  // on purpose: the derived below only recomputes when its reactive inputs
  // change and returns the previous result when nothing relevant changed.
  const selectedElementVersions = new Map<
    ExcalidrawElement["id"],
    ExcalidrawElement["version"]
  >();
  let pendingState: ReturnType<typeof getPendingElements> | undefined;

  const commitPending = (next: ReturnType<typeof getPendingElements>) => {
    pendingState = next;
    for (const element of next.pending) {
      selectedElementVersions.set(element.id, element.version);
    }
  };

  const pendingElements = $derived.by(() => {
    const { cursorButton, activeTool, selectedElementIds } = ctx.appState;
    // `ctx.elements` are the scene's non-deleted elements
    const elements = ctx.elements as readonly NonDeletedExcalidrawElement[];

    if (!pendingState) {
      commitPending(getPendingElements(elements, selectedElementIds));
    } else if (
      // Only update once pointer is released.
      cursorButton === "up" &&
      activeTool.type === "selection"
    ) {
      const prev = pendingState;
      // if selectedElementIds changed, we don't have to compare versions
      if (!isShallowEqual(prev.selectedElementIds, selectedElementIds)) {
        selectedElementVersions.clear();
        commitPending(getPendingElements(elements, selectedElementIds));
      } else {
        // otherwise we need to check whether selected elements changed
        const elementsMap = ctx.app.scene.getNonDeletedElementsMap();
        for (const id of Object.keys(selectedElementIds)) {
          const currVersion = elementsMap.get(id)?.version;
          if (currVersion && currVersion !== selectedElementVersions.get(id)) {
            commitPending(getPendingElements(elements, selectedElementIds));
            break;
          }
        }
      }
    }
    return pendingState!.pending;
  });

  const isInitialLoading = $derived(
    libraryItemsData.current.status === "loading" &&
      !libraryItemsData.current.isInitialized,
  );
  const showBtn = $derived(
    libraryItemsData.current.libraryItems.length > 0 ||
      pendingElements.length > 0,
  );

  $effect(() => {
    const app = ctx.app;
    const ownerDocument = app.ownerDocument;
    const ownerWindow = app.ownerWindow;
    return addEventListener(
      ownerDocument,
      EVENT.KEYDOWN,
      (event) => {
        if (
          event.key === KEYS.ESCAPE &&
          event.target instanceof ownerWindow.HTMLElement
        ) {
          const target = event.target;
          if (target.closest(`.${CLASSES.SIDEBAR}`)) {
            // stop propagation so that we don't prevent it downstream
            // (default browser behavior is to clear search input on ESC)
            if (selectedItems.length > 0) {
              event.stopPropagation();
              selectedItems = [];
            } else if (
              target instanceof ownerWindow.HTMLInputElement &&
              isWritableElement(target) &&
              !target.value
            ) {
              event.stopPropagation();
              // if search input empty -> close library
              // (maybe not a good idea?)
              ctx.setAppState({ openSidebar: null });
              app.focusContainer();
            }
          } else if (selectedItems.length > 0) {
            const { x, y } = app.viewport.lastPosition;
            const elementUnderCursor = ownerDocument.elementFromPoint(x, y);
            // also deselect elements if sidebar doesn't have focus but the
            // cursor is over it
            if (elementUnderCursor?.closest(`.${CLASSES.SIDEBAR}`)) {
              event.stopPropagation();
              selectedItems = [];
            }
          }
        }
      },
      { capture: true },
    );
  });

  const onInsertLibraryItems = (items: LibraryItems) => {
    ctx.app.onInsertElements(distributeLibraryItemsOnSquareGrid(items));
    ctx.app.focusContainer();
  };

  const deselectItems = () => {
    ctx.setAppState({
      selectedElementIds: {},
      selectedGroupIds: {},
      activeEmbeddable: null,
    });
  };

  const onAddToLibrary = (elements: LibraryItem["elements"]) => {
    trackEvent("element", "addToLibrary", "ui");
    for (const type of LIBRARY_DISABLED_TYPES) {
      if (elements.some((element) => element.type === type)) {
        ctx.setAppState({
          errorMessage: t(`errors.libraryElementTypeError.${type}`),
        });
        return;
      }
    }
    const nextItems: LibraryItems = [
      {
        status: "unpublished",
        elements,
        id: randomId(),
        created: Date.now(),
      },
      ...libraryItemsData.current.libraryItems,
    ];
    deselectItems();
    ctx.app.library.setLibrary(nextItems).catch(() => {
      ctx.setAppState({ errorMessage: t("alerts.errorAddingToLibrary") });
    });
  };
</script>

<div class="layer-ui__library">
  {#if isInitialLoading}
    <div class="layer-ui__library-message">
      <div>
        <Spinner size="2em" />
        <span>{t("labels.libraryLoadingMessage")}</span>
      </div>
    </div>
  {:else}
    <LibraryMenuItems
      isLoading={libraryItemsData.current.status === "loading"}
      libraryItems={libraryItemsData.current.libraryItems}
      {onAddToLibrary}
      {onInsertLibraryItems}
      {pendingElements}
      id={ctx.app.id}
      libraryReturnUrl={ctx.props.libraryReturnUrl}
      theme={ctx.appState.theme}
      onSelectItems={(items) => (selectedItems = items)}
      {selectedItems}
    />
    {#if showBtn}
      <LibraryMenuControlButtons
        class="library-menu-control-buttons--at-bottom"
        style="padding: 16px 12px 0 12px"
        id={ctx.app.id}
        libraryReturnUrl={ctx.props.libraryReturnUrl}
        theme={ctx.appState.theme}
      />
    {/if}
  {/if}
</div>
