<script lang="ts">
  import { KEYS, queryFocusableElements } from "@svelte-draw/common";

  import { editorJotaiStore } from "../editor-jotai";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Icon from "./Icon.svelte";
  import Island from "./Island.svelte";
  import { isLibraryMenuOpenAtom } from "./LibraryMenu";
  import Modal from "./Modal.svelte";
  import { CloseIcon } from "./icons";
  import { getDialogSize } from "./Dialog";

  import "./Dialog.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type { DialogSize } from "./Dialog";

  type Props = {
    children?: Snippet;
    class?: ClassValue;
    size?: DialogSize;
    onCloseRequest: () => void;
    /** `false` hides the title */
    title: string | Snippet | false;
    autofocus?: boolean;
    closeOnClickOutside?: boolean;
  };

  let {
    children,
    class: className,
    size,
    onCloseRequest,
    title,
    autofocus,
    closeOnClickOutside,
  }: Props = $props();

  const ctx = getEditorContext();

  let islandNode = $state<HTMLDivElement | null>(null);
  const lastActiveElement = ctx.app.ownerDocument.activeElement;
  const id = ctx.app.id;
  const isFullscreen = $derived(ctx.editorInterface.formFactor === "phone");

  $effect(() => {
    const node = islandNode;
    if (!node) {
      return;
    }

    const focusableElements = queryFocusableElements(node);

    const timer = setTimeout(() => {
      if (focusableElements.length > 0 && autofocus !== false) {
        // If there's an element other than close, focus it.
        (focusableElements[1] || focusableElements[0]).focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.TAB) {
        const focusableElements = queryFocusableElements(node);
        const { activeElement } = node.ownerDocument;
        const currentIndex = focusableElements.findIndex(
          (element) => element === activeElement,
        );

        if (currentIndex === 0 && event.shiftKey) {
          focusableElements[focusableElements.length - 1].focus();
          event.preventDefault();
        } else if (
          currentIndex === focusableElements.length - 1 &&
          !event.shiftKey
        ) {
          focusableElements[0].focus();
          event.preventDefault();
        }
      }
    };

    node.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      node.removeEventListener("keydown", handleKeyDown);
    };
  });

  const onClose = () => {
    ctx.setAppState({ openMenu: null });
    editorJotaiStore.set(isLibraryMenuOpenAtom, false);
    (lastActiveElement as HTMLElement).focus();
    onCloseRequest();
  };
</script>

<Modal
  class={["Dialog", className, { "Dialog--fullscreen": isFullscreen }]}
  labelledBy="dialog-title"
  maxWidth={getDialogSize(size)}
  onCloseRequest={onClose}
  {closeOnClickOutside}
>
  <Island bind:element={islandNode}>
    {#if title}
      <h2 id={`${id}-dialog-title`} class="Dialog__title">
        <span class="Dialog__titleContent">
          {#if typeof title === "string"}{title}{:else}{@render title()}{/if}
        </span>
      </h2>
    {/if}
    {#if isFullscreen}
      <button
        class="Dialog__close"
        onclick={onClose}
        title={t("buttons.close")}
        aria-label={t("buttons.close")}
        type="button"
      >
        <Icon icon={CloseIcon} />
      </button>
    {/if}
    <div class="Dialog__content">{@render children?.()}</div>
  </Island>
</Modal>
