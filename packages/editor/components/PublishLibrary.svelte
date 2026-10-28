<script lang="ts">
  import {
    EDITOR_LS_KEYS,
    EXPORT_DATA_TYPES,
    MIME_TYPES,
    VERSIONS,
    chunk,
    getExportSource,
  } from "@svelte-draw/common";

  import { EditorLocalStorage } from "../data/EditorLocalStorage";
  import { canvasToBlob, resizeImageFile } from "../data/blob";
  import { t } from "../i18n";
  import { getLibraryBrowseUrl, getLibraryPublishBackend } from "../libraryConfig";
  import { exportScene } from "../scene/export";
  import { getEditorContext } from "../ui/editorContext";

  import Dialog from "./Dialog.svelte";
  import DialogActionButton from "./DialogActionButton.svelte";
  import PublishLibrarySingleItem from "./PublishLibrarySingleItem.svelte";
  import Trans from "./Trans.svelte";

  import "./PublishLibrary.scss";

  import type { Snippet } from "svelte";
  import type { ExportedLibraryData } from "../data/types";
  import type { LibraryItems, LibraryItem, UIAppState } from "../types";

  interface PublishLibraryDataParams {
    authorName: string;
    githubHandle: string;
    name: string;
    description: string;
    twitterHandle: string;
    website: string;
  }

  type Props = {
    onClose: () => void;
    libraryItems: LibraryItems;
    appState: UIAppState;
    onSuccess: (data: {
      url: string;
      authorName: string;
      items: LibraryItems;
    }) => void;
    onError: (error: Error) => void;
    updateItemsInStorage: (items: LibraryItems) => void;
    onRemove: (id: string) => void;
  };

  let {
    onClose,
    libraryItems,
    appState,
    onSuccess,
    onError,
    updateItemsInStorage,
    onRemove,
  }: Props = $props();

  const generatePreviewImage = async (
    libraryItems: LibraryItems,
    ownerDocument: Document,
  ) => {
    const MAX_ITEMS_PER_ROW = 6;
    const BOX_SIZE = 128;
    const BOX_PADDING = Math.round(BOX_SIZE / 16);
    const BORDER_WIDTH = Math.max(Math.round(BOX_SIZE / 64), 2);

    const rows = chunk(libraryItems, MAX_ITEMS_PER_ROW);

    const canvas = ownerDocument.createElement("canvas");

    canvas.width =
      rows[0].length * BOX_SIZE +
      (rows[0].length + 1) * (BOX_PADDING * 2) -
      BOX_PADDING * 2;
    canvas.height =
      rows.length * BOX_SIZE +
      (rows.length + 1) * (BOX_PADDING * 2) -
      BOX_PADDING * 2;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw items
    // -------------------------------------------------------------------------
    for (const [index, item] of libraryItems.entries()) {
      const itemCanvas = await exportScene({
        type: "canvas",
        data: {
          elements: item.elements,
          files: null,
        },
        config: {
          maxWidthOrHeight: BOX_SIZE,
        },
      });

      const { width, height } = itemCanvas;

      // draw item
      // -----------------------------------------------------------------------
      const rowOffset =
        Math.floor(index / MAX_ITEMS_PER_ROW) * (BOX_SIZE + BOX_PADDING * 2);
      const colOffset =
        (index % MAX_ITEMS_PER_ROW) * (BOX_SIZE + BOX_PADDING * 2);

      ctx.drawImage(
        itemCanvas,
        colOffset + (BOX_SIZE - width) / 2 + BOX_PADDING,
        rowOffset + (BOX_SIZE - height) / 2 + BOX_PADDING,
      );

      // draw item border
      // -----------------------------------------------------------------------
      ctx.lineWidth = BORDER_WIDTH;
      ctx.strokeStyle = "#ced4da";
      ctx.strokeRect(
        colOffset + BOX_PADDING / 2,
        rowOffset + BOX_PADDING / 2,
        BOX_SIZE + BOX_PADDING,
        BOX_SIZE + BOX_PADDING,
      );
    }

    return await resizeImageFile(
      new File([await canvasToBlob(canvas)], "preview", {
        type: MIME_TYPES.png,
      }),
      {
        outputType: MIME_TYPES.jpg,
        maxWidthOrHeight: 5000,
      },
    );
  };

  const ctx = getEditorContext();

  let libraryData = $state<PublishLibraryDataParams>({
    authorName: "",
    githubHandle: "",
    name: "",
    description: "",
    twitterHandle: "",
    website: "",
    ...EditorLocalStorage.get<PublishLibraryDataParams>(
      EDITOR_LS_KEYS.PUBLISH_LIBRARY,
    ),
  });

  let isSubmitting = $state(false);

  // local copy of the items being edited; resets whenever `libraryItems`
  // changes, and is overridden by the user's edits in between
  let clonedLibItems = $derived.by(() => libraryItems.slice());

  const shouldRenderForm = $derived(!!libraryItems.length);
  const containsPublishedItems = $derived(
    libraryItems.some((item) => item.status === "published"),
  );

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    isSubmitting = true;
    const erroredLibItems: LibraryItem[] = [];
    let isError = false;
    clonedLibItems.forEach((libItem) => {
      let error = "";
      if (!libItem.name) {
        error = t("publishDialog.errors.required");
        isError = true;
      }
      erroredLibItems.push({ ...libItem, error });
    });

    if (isError) {
      clonedLibItems = erroredLibItems;
      isSubmitting = false;
      return;
    }

    const previewImage = await generatePreviewImage(
      clonedLibItems,
      ctx.container?.ownerDocument ?? document,
    );

    const libContent: ExportedLibraryData = {
      type: EXPORT_DATA_TYPES.excalidrawLibrary,
      version: VERSIONS.excalidrawLibrary,
      source: getExportSource(),
      libraryItems: clonedLibItems,
    };
    const content = JSON.stringify(libContent, null, 2);
    const lib = new Blob([content], { type: "application/json" });

    const data = $state.snapshot(libraryData);
    const formData = new FormData();
    formData.append("excalidrawLib", lib);
    formData.append("previewImage", previewImage);
    formData.append("previewImageType", previewImage.type);
    formData.append("title", data.name);
    formData.append("authorName", data.authorName);
    formData.append("githubHandle", data.githubHandle);
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("twitterHandle", data.twitterHandle);
    formData.append("website", data.website);

    const submittedItems = clonedLibItems;
    if (!getLibraryPublishBackend()) {
      // the menu entry is hidden in this case; never fall back to a default server
      const error = new Error(
        "Library publishing is not configured (VITE_APP_LIBRARY_BACKEND)",
      );
      console.error(error);
      onError(error);
      isSubmitting = false;
      return;
    }
    fetch(`${getLibraryPublishBackend()}/submit`, {
      method: "post",
      body: formData,
    })
      .then(
        (response) => {
          if (response.ok) {
            return response.json().then(({ url }) => {
              // flush data from local storage
              EditorLocalStorage.delete(EDITOR_LS_KEYS.PUBLISH_LIBRARY);
              onSuccess({
                url,
                authorName: data.authorName,
                items: submittedItems,
              });
            });
          }
          return response
            .json()
            .catch(() => {
              throw new Error(response.statusText || "something went wrong");
            })
            .then((error) => {
              throw new Error(
                error.message || response.statusText || "something went wrong",
              );
            });
        },
        (err) => {
          console.error(err);
          onError(err);
          isSubmitting = false;
        },
      )
      .catch((err) => {
        console.error(err);
        onError(err);
        isSubmitting = false;
      });
  };

  const onDialogClose = () => {
    updateItemsInStorage(clonedLibItems);
    EditorLocalStorage.set(
      EDITOR_LS_KEYS.PUBLISH_LIBRARY,
      $state.snapshot(libraryData),
    );
    onClose();
  };
</script>

<Dialog
  onCloseRequest={onDialogClose}
  title={t("publishDialog.title")}
  class="publish-library"
>
  {#if shouldRenderForm}
    <form onsubmit={onSubmit}>
      <div class="publish-library-note">
        <Trans i18nKey="publishDialog.noteDescription" {link} />
      </div>
      <span class="publish-library-note">
        <Trans i18nKey="publishDialog.noteGuidelines" link={guidelinesLink} />
      </span>

      <div class="publish-library-note">
        {t("publishDialog.noteItems")}
      </div>
      {#if containsPublishedItems}
        <span class="publish-library-note publish-library-warning">
          {t("publishDialog.republishWarning")}
        </span>
      {/if}
      <div class="selected-library-items">
        {#each clonedLibItems as libItem, index (index)}
          <div class="single-library-item-wrapper">
            <PublishLibrarySingleItem
              {libItem}
              {appState}
              {index}
              onChange={(val, index) => {
                const items = clonedLibItems.slice();
                items[index].name = val;
                clonedLibItems = items;
              }}
              {onRemove}
            />
          </div>
        {/each}
      </div>
      <div class="publish-library__fields">
        <label>
          <div>
            <span>{t("publishDialog.libraryName")}</span>
            <span aria-hidden="true" class="required">*</span>
          </div>
          <input
            type="text"
            name="name"
            required
            bind:value={libraryData.name}
            placeholder={t("publishDialog.placeholder.libraryName")}
          />
        </label>
        <label style="align-items: flex-start">
          <div>
            <span>{t("publishDialog.libraryDesc")}</span>
            <span aria-hidden="true" class="required">*</span>
          </div>
          <textarea
            name="description"
            rows={4}
            required
            bind:value={libraryData.description}
            placeholder={t("publishDialog.placeholder.libraryDesc")}
          ></textarea>
        </label>
        <label>
          <div>
            <span>{t("publishDialog.authorName")}</span>
            <span aria-hidden="true" class="required">*</span>
          </div>
          <input
            type="text"
            name="authorName"
            required
            bind:value={libraryData.authorName}
            placeholder={t("publishDialog.placeholder.authorName")}
          />
        </label>
        <label>
          <span>{t("publishDialog.githubUsername")}</span>
          <input
            type="text"
            name="githubHandle"
            bind:value={libraryData.githubHandle}
            placeholder={t("publishDialog.placeholder.githubHandle")}
          />
        </label>
        <label>
          <span>{t("publishDialog.twitterUsername")}</span>
          <input
            type="text"
            name="twitterHandle"
            bind:value={libraryData.twitterHandle}
            placeholder={t("publishDialog.placeholder.twitterHandle")}
          />
        </label>
        <label>
          <span>{t("publishDialog.website")}</span>
          <input
            type="text"
            name="website"
            pattern="https?://.+"
            title={t("publishDialog.errors.website")}
            bind:value={libraryData.website}
            placeholder={t("publishDialog.placeholder.website")}
          />
        </label>
        <span class="publish-library-note">
          <Trans i18nKey="publishDialog.noteLicense" link={licenseLink} />
        </span>
      </div>
      <div class="publish-library__buttons">
        <DialogActionButton
          label={t("buttons.saveLibNames")}
          onclick={onDialogClose}
          data-testid="cancel-clear-canvas-button"
        />
        <DialogActionButton
          type="submit"
          label={t("buttons.submit")}
          actionType="primary"
          isLoading={isSubmitting}
        />
      </div>
    </form>
  {:else}
    <p style="padding: 1em; text-align: center; font-weight: 500">
      {t("publishDialog.atleastOneLibItem")}
    </p>
  {/if}
</Dialog>

{#snippet link(children: Snippet)}
  <a href={getLibraryBrowseUrl() || undefined} target="_blank" rel="noopener">
    {@render children()}
  </a>
{/snippet}

{#snippet guidelinesLink(children: Snippet)}
  <a
    href={getLibraryBrowseUrl() || undefined}
    target="_blank"
    rel="noopener noreferrer"
  >
    {@render children()}
  </a>
{/snippet}

{#snippet licenseLink(children: Snippet)}
  <a
    href="https://opensource.org/license/mit"
    target="_blank"
    rel="noopener noreferrer"
  >
    {@render children()}
  </a>
{/snippet}
