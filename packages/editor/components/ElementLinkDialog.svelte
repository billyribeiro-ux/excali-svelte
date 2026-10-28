<script lang="ts">
  import { normalizeLink, KEYS } from "@svelte-draw/common";

  import {
    defaultGetElementLinkFromSelection,
    getLinkIdAndTypeFromSelection,
  } from "@svelte-draw/element";

  import type { ExcalidrawElement } from "@svelte-draw/element/types";
  import type { Scene } from "@svelte-draw/element";

  import { t } from "../i18n";
  import { getSelectedElements } from "../scene";

  import DialogActionButton from "./DialogActionButton.svelte";
  import TextField from "./TextField.svelte";
  import IconButton from "./IconButton.svelte";
  import { TrashIcon } from "./icons";

  import "./ElementLinkDialog.scss";

  import type { AppProps, AppState, UIAppState } from "../types";

  type Props = {
    sourceElementId: ExcalidrawElement["id"];
    appState: UIAppState;
    scene: Scene;
    onClose?: () => void;
    generateLinkForSelection?: AppProps["generateLinkForSelection"];
  };

  let {
    sourceElementId,
    onClose,
    appState,
    scene,
    generateLinkForSelection = defaultGetElementLinkFromSelection,
  }: Props = $props();

  const elementsMap = $derived(scene.getNonDeletedElementsMap());
  const originalLink = $derived(elementsMap.get(sourceElementId)?.link ?? null);

  // follows the current selection; recomputed whenever the app state, scene
  // or generator change (this discards a manual edit exactly like the React
  // effect that reset the input did). Assigned to when the user edits the
  // input, which temporarily overrides the derived value.
  let nextLink = $derived.by<string | null>(() => {
    const selectedElements = getSelectedElements(elementsMap, appState);
    let link = originalLink;

    if (selectedElements.length > 0 && generateLinkForSelection) {
      const idAndType = getLinkIdAndTypeFromSelection(
        selectedElements,
        appState as AppState,
      );

      if (idAndType) {
        link = normalizeLink(
          generateLinkForSelection(idAndType.id, idAndType.type),
        );
      }
    }

    return link;
  });
  let linkEdited = $state(false);

  const handleConfirm = () => {
    if (nextLink && nextLink !== elementsMap.get(sourceElementId)?.link) {
      const elementToLink = elementsMap.get(sourceElementId);
      elementToLink &&
        scene.mutateElement(elementToLink, {
          link: nextLink,
        });
    }

    if (!nextLink && linkEdited && sourceElementId) {
      const elementToLink = elementsMap.get(sourceElementId);
      elementToLink &&
        scene.mutateElement(elementToLink, {
          link: null,
        });
    }

    onClose?.();
  };

  const handleWindowKeyDown = (event: KeyboardEvent) => {
    if (appState.openDialog?.name === "elementLinkSelector") {
      if (event.key === KEYS.ENTER) {
        handleConfirm();
      }
      if (event.key === KEYS.ESCAPE) {
        onClose?.();
      }
    }
  };
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

<div class="ElementLinkDialog">
  <div class="ElementLinkDialog__header">
    <h2>{t("elementLink.title")}</h2>
    <p>{t("elementLink.desc")}</p>
  </div>

  <div class="ElementLinkDialog__input">
    <TextField
      value={nextLink ?? ""}
      onChange={(value: string) => {
        if (!linkEdited) {
          linkEdited = true;
        }
        nextLink = value;
      }}
      onkeydown={(event: KeyboardEvent) => {
        if (event.key === KEYS.ENTER) {
          handleConfirm();
        }
      }}
      class="ElementLinkDialog__input-field"
      selectOnRender
    />

    {#if originalLink && nextLink}
      <IconButton
        type="button"
        title={t("buttons.remove")}
        aria-label={t("buttons.remove")}
        label={t("buttons.remove")}
        onclick={() => {
          // removes the link from the input
          // but doesn't update the element

          // when confirmed, will remove the link from the element
          nextLink = null;
          linkEdited = true;
        }}
        class="ElementLinkDialog__remove"
        icon={TrashIcon}
      />
    {/if}
  </div>

  <div class="ElementLinkDialog__actions">
    <DialogActionButton
      label={t("buttons.cancel")}
      onclick={() => {
        onClose?.();
      }}
      style="margin-right: 10px"
    />

    <DialogActionButton
      label={t("buttons.confirm")}
      onclick={handleConfirm}
      actionType="primary"
    />
  </div>
</div>
