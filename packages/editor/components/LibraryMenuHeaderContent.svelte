<script lang="ts">
  import { libraryItemsAtom } from "../data/library";
  import { useAtom } from "../editor-jotai";
  import { useLibraryCache } from "../hooks/libraryItemSvg.svelte";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import LibraryDropdownMenuButton from "./LibraryDropdownMenuButton.svelte";

  import type { ClassValue } from "svelte/elements";
  import type { LibraryItem, LibraryItems } from "../types";

  type Props = {
    selectedItems: LibraryItem["id"][];
    onSelectItems: (id: LibraryItem["id"][]) => void;
    class?: ClassValue;
  };

  let { selectedItems, onSelectItems, class: className }: Props = $props();

  const ctx = getEditorContext();
  const { clearLibraryCache, deleteItemsFromLibraryCache } = useLibraryCache();
  const libraryItemsData = useAtom(libraryItemsAtom);

  const removeFromLibrary = async (libraryItems: LibraryItems) => {
    const nextItems = libraryItems.filter(
      (item) => !selectedItems.includes(item.id),
    );
    ctx.app.library.setLibrary(nextItems).catch(() => {
      ctx.setAppState({ errorMessage: t("alerts.errorRemovingFromLibrary") });
    });

    deleteItemsFromLibraryCache(selectedItems);

    onSelectItems([]);
  };

  const resetLibrary = () => {
    ctx.app.library.resetLibrary();
    clearLibraryCache();
  };
</script>

<LibraryDropdownMenuButton
  appState={ctx.appState}
  setAppState={ctx.setAppState}
  {selectedItems}
  {onSelectItems}
  library={ctx.app.library}
  onRemoveFromLibrary={() =>
    removeFromLibrary(libraryItemsData.current.libraryItems)}
  {resetLibrary}
  class={className}
/>
