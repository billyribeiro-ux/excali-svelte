<script lang="ts">
  import { pointFrom } from "@svelte-draw/math";

  import {
    EVENT,
    KEYS,
    isLocalLink,
    normalizeLink,
    wrapEvent,
  } from "@svelte-draw/common";

  import { embeddableURLValidator, getEmbedLink } from "@svelte-draw/element";
  import { isEmbeddableElement } from "@svelte-draw/element";

  import type { Scene } from "@svelte-draw/element";
  import type {
    ExcalidrawEmbeddableElement,
    NonDeletedExcalidrawElement,
  } from "@svelte-draw/element/types";

  import { trackEvent } from "../../analytics";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import IconButton from "../IconButton.svelte";
  import { FreedrawIcon, TrashIcon, elementLinkIcon } from "../icons";

  import {
    AUTO_HIDE_TIMEOUT,
    POPUP_PADDING,
    POPUP_WIDTH,
    embeddableLinkCache,
    getCoordsForPopover,
    shouldHideLinkPopup,
  } from "./Hyperlink";

  import "./Hyperlink.scss";

  import type {
    AppClassProperties,
    SvelteDrawProps,
  } from "../../types";

  type Props = {
    element: NonDeletedExcalidrawElement;
    scene: Scene;
    setAppState: AppClassProperties["setAppState"];
    onLinkOpen: SvelteDrawProps["onLinkOpen"];
    setToast: (
      toast: { message: string; closable?: boolean; duration?: number } | null,
    ) => void;
    updateEmbedValidationStatus: (
      element: ExcalidrawEmbeddableElement,
      status: boolean,
    ) => void;
  };

  let {
    element,
    scene,
    setAppState,
    onLinkOpen,
    setToast,
    updateEmbedValidationStatus,
  }: Props = $props();

  const ctx = getEditorContext();

  const appState = $derived(ctx.appState);
  const elementsMap = $derived(scene.getNonDeletedElementsMap());
  const linkVal = $derived(element.link || "");

  // initial value only, like the React `useState(linkVal)`
  // svelte-ignore state_referenced_locally
  let inputVal = $state(element.link || "");
  let inputEl: HTMLInputElement | null = $state(null);
  const isEditing = $derived(appState.showHyperlinkPopup === "editor");

  const handleSubmit = (value: string | undefined = inputEl?.value) => {
    if (value === undefined) {
      return;
    }

    const link = normalizeLink(value) || null;

    if (!element.link && link) {
      trackEvent("hyperlink", "create");
    }

    if (isEmbeddableElement(element)) {
      if (appState.activeEmbeddable?.element === element) {
        setAppState({ activeEmbeddable: null });
      }
      if (!link) {
        scene.mutateElement(element, {
          link: null,
        });
        updateEmbedValidationStatus(element, false);
        return;
      }

      if (!embeddableURLValidator(link, ctx.props.validateEmbeddable)) {
        if (link) {
          setToast({ message: t("toast.unableToEmbed"), closable: true });
        }
        element.link && embeddableLinkCache.set(element.id, element.link);
        scene.mutateElement(element, {
          link,
        });
        updateEmbedValidationStatus(element, false);
      } else {
        const { width, height } = element;
        const embedLink = getEmbedLink(link);
        if (embedLink?.error instanceof URIError) {
          setToast({
            message: t("toast.unrecognizedLinkFormat"),
            closable: true,
          });
        }
        const ar = embedLink
          ? embedLink.intrinsicSize.w / embedLink.intrinsicSize.h
          : 1;
        const hasLinkChanged =
          embeddableLinkCache.get(element.id) !== element.link;
        scene.mutateElement(element, {
          ...(hasLinkChanged
            ? {
                width:
                  embedLink?.type === "video"
                    ? width > height
                      ? width
                      : height * ar
                    : width,
                height:
                  embedLink?.type === "video"
                    ? width > height
                      ? width / ar
                      : height
                    : height,
              }
            : {}),
          link,
        });
        updateEmbedValidationStatus(element, true);
        if (embeddableLinkCache.has(element.id)) {
          embeddableLinkCache.delete(element.id);
        }
      }
    } else {
      scene.mutateElement(element, { link });
    }
  };

  /**
   * Submits a pending edit when the input leaves the DOM (popup closed or
   * editing finished), mirroring the React layout-effect cleanup.
   */
  const trackInput = (node: HTMLInputElement) => {
    inputEl = node;
    return () => {
      handleSubmit(node.value);
      if (inputEl === node) {
        inputEl = null;
      }
    };
  };

  $effect(() => {
    if (
      isEditing &&
      inputEl &&
      !(
        ctx.editorInterface.formFactor === "phone" ||
        ctx.editorInterface.isTouchScreen
      )
    ) {
      inputEl.select();
    }
  });

  $effect(() => {
    if (isEditing) {
      return;
    }
    let timeoutId: number | null = null;

    // the editor may be rendered into another document, in which case pointer
    // events never reach the module-realm window
    const ownerWindow = ctx.app.ownerWindow;
    const currentElement = element;
    const currentMap = elementsMap;
    const currentState = appState;

    const handlePointerMove = (event: PointerEvent) => {
      if (timeoutId) {
        ownerWindow.clearTimeout(timeoutId);
      }
      const shouldHide = shouldHideLinkPopup(
        currentElement,
        currentMap,
        currentState,
        pointFrom(event.clientX, event.clientY),
      ) as boolean;
      if (shouldHide) {
        timeoutId = ownerWindow.setTimeout(() => {
          setAppState({ showHyperlinkPopup: false });
        }, AUTO_HIDE_TIMEOUT);
      }
    };
    ownerWindow.addEventListener(EVENT.POINTER_MOVE, handlePointerMove, false);
    return () => {
      ownerWindow.removeEventListener(
        EVENT.POINTER_MOVE,
        handlePointerMove,
        false,
      );
      if (timeoutId) {
        ownerWindow.clearTimeout(timeoutId);
      }
    };
  });

  const handleRemove = () => {
    trackEvent("hyperlink", "delete");
    scene.mutateElement(element, { link: null });
    setAppState({ showHyperlinkPopup: false });
  };

  const onEdit = () => {
    trackEvent("hyperlink", "edit", "popup-ui");
    setAppState({ showHyperlinkPopup: "editor" });
  };

  const coords = $derived(getCoordsForPopover(element, appState, elementsMap));
  const hidden = $derived(
    !!(
      appState.contextMenu ||
      appState.selectedElementsAreBeingDragged ||
      appState.resizingElement ||
      appState.isRotating ||
      appState.openMenu ||
      appState.viewModeEnabled
    ),
  );

  const onKeydown = (event: KeyboardEvent) => {
    event.stopPropagation();
    // prevent cmd/ctrl+k shortcut when editing link
    if (event[KEYS.CTRL_OR_CMD] && event.key === KEYS.K) {
      event.preventDefault();
    }
    if (event.key === KEYS.ENTER || event.key === KEYS.ESCAPE) {
      handleSubmit();
      setAppState({ showHyperlinkPopup: "info" });
    }
  };

  const onLinkClick = (event: MouseEvent) => {
    if (element.link && onLinkOpen) {
      const customEvent = wrapEvent(EVENT.EXCALIDRAW_LINK, event);
      onLinkOpen(
        {
          ...element,
          link: normalizeLink(element.link),
        },
        customEvent,
      );
      if (customEvent.defaultPrevented) {
        event.preventDefault();
      }
    }
  };
</script>

{#if !hidden}
  <div
    class="excalidraw-hyperlinkContainer"
    style:top="{coords.y}px"
    style:left="{coords.x}px"
    style:width="{POPUP_WIDTH}px"
    style:padding="{POPUP_PADDING}px"
  >
    {#if isEditing}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="excalidraw-hyperlinkContainer-input"
        placeholder={t("labels.link.hint")}
        bind:value={inputVal}
        autofocus
        onkeydown={onKeydown}
        {@attach trackInput}
      />
    {:else if element.link}
      <a
        href={normalizeLink(element.link || "")}
        class="excalidraw-hyperlinkContainer-link"
        target={isLocalLink(element.link) ? "_self" : "_blank"}
        onclick={onLinkClick}
        rel="noopener noreferrer"
      >
        {element.link}
      </a>
    {:else}
      <div class="excalidraw-hyperlinkContainer-link">
        {t("labels.link.empty")}
      </div>
    {/if}
    <div class="excalidraw-hyperlinkContainer__buttons">
      {#if !isEditing}
        <IconButton
          type="button"
          title={t("buttons.edit")}
          aria-label={t("buttons.edit")}
          label={t("buttons.edit")}
          onclick={onEdit}
          class="excalidraw-hyperlinkContainer--edit"
          icon={FreedrawIcon}
        />
      {/if}
      <IconButton
        type="button"
        title={t("labels.linkToElement")}
        aria-label={t("labels.linkToElement")}
        label={t("labels.linkToElement")}
        onclick={() => {
          setAppState({
            openDialog: {
              name: "elementLinkSelector",
              sourceElementId: element.id,
            },
          });
        }}
        icon={elementLinkIcon}
      />
      {#if linkVal && !isEmbeddableElement(element)}
        <IconButton
          type="button"
          title={t("buttons.remove")}
          aria-label={t("buttons.remove")}
          label={t("buttons.remove")}
          onclick={handleRemove}
          class="excalidraw-hyperlinkContainer--remove"
          icon={TrashIcon}
        />
      {/if}
    </div>
  </div>
{/if}
