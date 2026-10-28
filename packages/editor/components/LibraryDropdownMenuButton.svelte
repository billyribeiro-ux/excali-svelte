<script lang="ts">
  import { muteFSAbortError } from "@svelte-draw/common";

  import { fileOpen } from "../data/filesystem";
  import { saveLibraryAsJSON } from "../data/json";
  import { libraryItemsAtom } from "../data/library";
  import { useAtom } from "../editor-jotai";
  import { t } from "../i18n";
  import { getLibraryPublishBackend } from "../libraryConfig";

  import ConfirmDialog from "./ConfirmDialog.svelte";
  import Dialog from "./Dialog.svelte";
  import DropdownMenu from "./dropdownMenu/DropdownMenu";
  import Icon from "./Icon.svelte";
  import IconButton from "./IconButton.svelte";
  import { DotsIcon, ExportIcon, LoadIcon, publishIcon, TrashIcon } from "./icons";
  import { isLibraryMenuOpenAtom } from "./LibraryMenu";
  import PublishLibrary from "./PublishLibrary.svelte";
  import Trans from "./Trans.svelte";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type Library from "../data/library";
  import type { AppClassProperties, LibraryItem, LibraryItems, UIAppState } from "../types";

  type Props = {
    setAppState: AppClassProperties["setAppState"];
    selectedItems: LibraryItem["id"][];
    library: Library;
    onRemoveFromLibrary: () => void;
    resetLibrary: () => void;
    onSelectItems: (items: LibraryItem["id"][]) => void;
    appState: UIAppState;
    class?: ClassValue;
  };

  let {
    setAppState,
    selectedItems,
    library,
    onRemoveFromLibrary,
    resetLibrary,
    onSelectItems,
    appState,
    class: className,
  }: Props = $props();

  const libraryItemsData = useAtom(libraryItemsAtom);
  const isLibraryMenuOpen = useAtom(isLibraryMenuOpenAtom);

  let showRemoveLibAlert = $state(false);
  // publishing needs a configured library backend (VITE_APP_LIBRARY_BACKEND)
  const canPublish = !!getLibraryPublishBackend();
  let showPublishLibraryDialog = $state(false);
  let publishLibSuccess = $state.raw<null | {
    url: string;
    authorName: string;
  }>(null);

  const itemsSelected = $derived(!!selectedItems.length);
  const items = $derived(
    itemsSelected
      ? libraryItemsData.current.libraryItems.filter((item) =>
          selectedItems.includes(item.id),
        )
      : libraryItemsData.current.libraryItems,
  );
  const selectedLibraryItems = $derived(
    libraryItemsData.current.libraryItems.filter((item) =>
      selectedItems.includes(item.id),
    ),
  );
  const resetLabel = $derived(
    itemsSelected ? t("buttons.remove") : t("buttons.resetLibrary"),
  );
  const removeAlertContent = $derived(
    selectedItems.length
      ? t("alerts.removeItemsFromsLibrary", { count: selectedItems.length })
      : t("alerts.resetLibrary"),
  );
  const removeAlertTitle = $derived(
    selectedItems.length
      ? t("confirmDialog.removeItemsFromLib")
      : t("confirmDialog.resetLibrary"),
  );

  const onPublishLibSuccess = (
    data: { url: string; authorName: string },
    libraryItems: LibraryItems,
  ) => {
    showPublishLibraryDialog = false;
    publishLibSuccess = { url: data.url, authorName: data.authorName };
    const nextLibItems = libraryItems.slice();
    nextLibItems.forEach((libItem) => {
      if (selectedItems.includes(libItem.id)) {
        libItem.status = "published";
      }
    });
    library.setLibrary(nextLibItems);
  };

  const onLibraryImport = async () => {
    try {
      await library.updateLibrary({
        libraryItems: fileOpen({
          description: "svelte-draw library files",
          // ToDo: Be over-permissive until https://bugs.webkit.org/show_bug.cgi?id=34442
          // gets resolved. Else, iOS users cannot open `.excalidraw` files.
        }),
        merge: true,
        openLibraryMenu: true,
      });
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.warn(error);
        return;
      }
      setAppState({ errorMessage: t("errors.importLibraryError") });
    }
  };

  const onLibraryExport = async () => {
    const libraryItems = itemsSelected
      ? items
      : await library.getLatestLibrary();
    saveLibraryAsJSON(libraryItems)
      .catch(muteFSAbortError)
      .catch((error) => {
        setAppState({ errorMessage: error.message });
      });
  };
</script>

<div class={["library-menu-dropdown-container", className]}>
  <DropdownMenu open={isLibraryMenuOpen.current}>
    <DropdownMenu.Trigger
      onToggle={() => (isLibraryMenuOpen.current = !isLibraryMenuOpen.current)}
    >
      <Icon icon={DotsIcon} />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      onClickOutside={() => (isLibraryMenuOpen.current = false)}
      onSelect={() => (isLibraryMenuOpen.current = false)}
      class="library-menu"
    >
      {#if !itemsSelected}
        <DropdownMenu.Item
          onSelect={onLibraryImport}
          icon={LoadIcon}
          data-testid="lib-dropdown--load"
        >
          {t("buttons.load")}
        </DropdownMenu.Item>
      {/if}
      {#if items.length}
        <DropdownMenu.Item
          onSelect={onLibraryExport}
          icon={ExportIcon}
          data-testid="lib-dropdown--export"
        >
          {t("buttons.export")}
        </DropdownMenu.Item>
      {/if}
      {#if itemsSelected && canPublish}
        <DropdownMenu.Item
          icon={publishIcon}
          onSelect={() => (showPublishLibraryDialog = true)}
          data-testid="lib-dropdown--remove"
        >
          {t("buttons.publishLibrary")}
        </DropdownMenu.Item>
      {/if}
      {#if items.length}
        <DropdownMenu.Item
          onSelect={() => (showRemoveLibAlert = true)}
          icon={TrashIcon}
        >
          {resetLabel}
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu>
  {#if selectedItems.length > 0}
    <div class="library-actions-counter">{selectedItems.length}</div>
  {/if}
  {#if showRemoveLibAlert}
    <ConfirmDialog
      onConfirm={() => {
        if (selectedItems.length) {
          onRemoveFromLibrary();
        } else {
          resetLibrary();
        }
        showRemoveLibAlert = false;
      }}
      onCancel={() => (showRemoveLibAlert = false)}
      title={removeAlertTitle}
    >
      <p>{removeAlertContent}</p>
    </ConfirmDialog>
  {/if}
  {#if showPublishLibraryDialog}
    <PublishLibrary
      onClose={() => (showPublishLibraryDialog = false)}
      libraryItems={selectedLibraryItems}
      {appState}
      onSuccess={(data) =>
        onPublishLibSuccess(data, libraryItemsData.current.libraryItems)}
      onError={(error) => setAppState({ errorMessage: error.message })}
      updateItemsInStorage={() =>
        library.setLibrary(libraryItemsData.current.libraryItems)}
      onRemove={(id: string) =>
        onSelectItems(selectedItems.filter((_id) => _id !== id))}
    />
  {/if}
  {#if publishLibSuccess}
    <Dialog
      onCloseRequest={() => (publishLibSuccess = null)}
      title={t("publishSuccessDialog.title")}
      class="publish-library-success"
      size="small"
    >
      <p>
        <Trans
          i18nKey="publishSuccessDialog.content"
          authorName={publishLibSuccess.authorName}
          {link}
        />
      </p>
      <IconButton
        type="button"
        title={t("buttons.close")}
        aria-label={t("buttons.close")}
        label={t("buttons.close")}
        onclick={() => (publishLibSuccess = null)}
        data-testid="publish-library-success-close"
        class="publish-library-success-close"
      />
    </Dialog>
  {/if}
</div>

{#snippet link(children: Snippet)}
  <a href={publishLibSuccess?.url} target="_blank" rel="noopener noreferrer">
    {@render children()}
  </a>
{/snippet}
