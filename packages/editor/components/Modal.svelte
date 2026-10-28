<script lang="ts">
  import { KEYS } from "@svelte-draw/common";

  import { createPortalContainer } from "../hooks/portalContainer.svelte";
  import { portal } from "../ui/portal";

  import "./Modal.scss";

  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ClassValue } from "svelte/elements";

  import type { AppState } from "../types";

  type Props = {
    class?: ClassValue;
    children?: Snippet;
    maxWidth?: number;
    onCloseRequest: () => void;
    labelledBy: string;
    /** unused, kept for parity with the React API */
    theme?: AppState["theme"];
    closeOnClickOutside?: boolean;
  };

  let {
    class: className,
    children,
    maxWidth,
    onCloseRequest,
    labelledBy,
    closeOnClickOutside = true,
  }: Props = $props();

  const modalRoot = createPortalContainer({
    className: "excalidraw-modal-container",
  });

  const animationsDisabled = $derived(
    modalRoot.div?.ownerDocument.body.classList.contains(
      "excalidraw-animations-disabled",
    ) ?? false,
  );

  // Native listener on the modal itself (not a delegated `onkeydown`), so that
  // Escape is stopped before it reaches the editor's document-level handlers.
  const closeOnEscape: Attachment<HTMLDivElement> = (element) => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        onCloseRequest();
      }
    };
    element.addEventListener("keydown", handleKeydown);
    return () => element.removeEventListener("keydown", handleKeydown);
  };
</script>

{#if modalRoot.div}
  {@const root = modalRoot.div}
  <div
    class={["Modal", className, { "animations-disabled": animationsDisabled }]}
    role="dialog"
    aria-modal="true"
    aria-labelledby={labelledBy}
    {@attach portal(root)}
    {@attach closeOnEscape}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="Modal__background"
      onclick={closeOnClickOutside ? () => onCloseRequest() : undefined}
    ></div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="Modal__content" style:--max-width={`${maxWidth}px`} tabindex="0">
      {@render children?.()}
    </div>
  </div>
{/if}
