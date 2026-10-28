<script lang="ts">
  import { Popover } from "bits-ui";

  import { isInteractive } from "@svelte-draw/common";

  import { getEditorContext } from "../ui/editorContext";

  import Island from "./Island.svelte";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    class?: ClassValue;
    container: HTMLDivElement | null;
    children: Snippet;
    /** inline style of the inner island */
    style?: string;
    onClose: () => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onpointerleave?: (event: PointerEvent) => void;
    onFocusOutside?: (event: FocusEvent) => void;
    /** can be prevented to keep the popover open */
    onPointerDownOutside?: (event: PointerEvent) => void;
    preventAutoFocusOnTouch?: boolean;
    /** the popover content element */
    ref?: HTMLDivElement | null;
  };

  let {
    class: className,
    container,
    children,
    style,
    onClose,
    onkeydown,
    onpointerleave,
    onFocusOutside,
    onPointerDownOutside,
    preventAutoFocusOnTouch = false,
    ref = $bindable(null),
  }: Props = $props();

  const ctx = getEditorContext();

  const isMobilePortrait = $derived(
    ctx.editorInterface.formFactor === "phone" &&
      !ctx.editorInterface.isLandscape,
  );
  const isPhone = $derived(ctx.editorInterface.formFactor === "phone");
</script>

<Popover.Portal to={container ?? undefined}>
  <Popover.Content
    bind:ref
    class={["focus-visible-none", className]}
    data-prevent-outside-click
    side={isMobilePortrait ? "bottom" : "right"}
    align={isMobilePortrait ? "center" : "start"}
    alignOffset={-16}
    sideOffset={20}
    collisionBoundary={container ?? undefined}
    trapFocus={false}
    style="z-index: var(--zIndex-ui-styles-popup);{isPhone
      ? ' margin-left: 0.5rem;'
      : ''}"
    {onpointerleave}
    {onkeydown}
    {onFocusOutside}
    onInteractOutside={onPointerDownOutside}
    onOpenAutoFocus={(event) => {
      // prevent auto-focus on touch devices to avoid keyboard popup
      if (preventAutoFocusOnTouch && ctx.editorInterface.isTouchScreen) {
        event.preventDefault();
      }
    }}
    onCloseAutoFocus={(event) => {
      event.stopPropagation();
      // prevents focusing the trigger
      event.preventDefault();

      // Radix runs this handler from a `setTimeout(0)` after the content
      // unmounted (FocusScope), whereas Bits UI runs it synchronously during
      // teardown. Callers' `onClose` clears `appState.openPopup`, so defer
      // like Radix: a popover that vanishes with its owner (e.g. its
      // selected element got deleted) must not reset `openPopup` mid-commit.
      const ownerWindow = container?.ownerDocument.defaultView ?? window;
      ownerWindow.setTimeout(() => {
        // return focus to excalidraw container unless
        // user focuses an interactive element, such as a button, or
        // enters the text editor by clicking on canvas with the text tool
        if (
          container &&
          !isInteractive(container.ownerDocument.activeElement)
        ) {
          container.focus();
        }

        onClose();
      }, 0);
    }}
  >
    <Island padding={3} {style}>
      {@render children()}
    </Island>
    <Popover.Arrow
      width={20}
      height={10}
      style="fill: var(--popup-bg-color); filter: drop-shadow(rgba(0, 0, 0, 0.05) 0px 3px 2px);"
    />
  </Popover.Content>
</Popover.Portal>
