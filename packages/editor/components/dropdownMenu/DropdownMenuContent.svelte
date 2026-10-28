<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import clsx from "clsx";

  import { CLASSES, EVENT, KEYS } from "@svelte-draw/common";

  import { outsideClick } from "../../hooks/outsideClick";
  import { getEditorContext } from "../../ui/editorContext";
  import Island from "../Island.svelte";
  import StackCol from "../StackCol.svelte";

  import { setDropdownMenuContentProps } from "./common";

  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children?: Snippet;
    onClickOutside?: () => void;
    class?: ClassValue;
    /**
     * Called when any menu item is selected (clicked on).
     */
    onSelect?: (event: Event) => void;
    style?: string;
    align?: "start" | "center" | "end";
  };

  let {
    children,
    onClickOutside,
    class: className = "",
    onSelect,
    align = "end",
    style,
  }: Props = $props();

  const ctx = getEditorContext();

  setDropdownMenuContentProps({
    get onSelect() {
      return onSelect;
    },
  });

  const isPhone = $derived(ctx.editorInterface.formFactor === "phone");

  const classNames = $derived(
    clsx("dropdown-menu", className, { "dropdown-menu--mobile": isPhone }),
  );

  // Bits UI mounts the content lazily, so these attach when it opens and
  // detach when it closes (what `useCallbackRefState` + effects did in React)

  // prevents closing if clicking on the trigger button
  const closeOnOutsideClick: Attachment<HTMLElement> = (menu) =>
    outsideClick((event) => {
      if (
        !menu
          .closest(`.${CLASSES.DROPDOWN_MENU_EVENT_WRAPPER}`)
          ?.contains(event.target)
      ) {
        onClickOutside?.();
      }
    })(menu);

  const closeOnEscape: Attachment<HTMLElement> = (menu) => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClickOutside?.();
      }
    };

    const option = {
      // so that we can stop propagation of the event before it reaches
      // event handlers that were bound before this one
      capture: true,
    };

    const ownerDocument = menu.ownerDocument;
    ownerDocument.addEventListener(EVENT.KEYDOWN, onKeyDown, option);
    return () => {
      ownerDocument.removeEventListener(EVENT.KEYDOWN, onKeyDown, option);
    };
  };

  let contentElement: HTMLElement | null = null;

  const registerContent: Attachment<HTMLElement> = (element) => {
    contentElement = element;
    return () => {
      contentElement = null;
    };
  };
</script>

<DropdownMenuPrimitive.Content
  class={classNames}
  {style}
  data-testid="dropdown-menu"
  {align}
  sideOffset={8}
  preventScroll={false}
  strategy="fixed"
  onOpenAutoFocus={(event: Event) => {
    // like the original menu primitive: the menu container takes focus, not
    // its first focusable item (which would show a focus ring on it)
    event.preventDefault();
    contentElement?.focus({ preventScroll: true });
  }}
  onCloseAutoFocus={(event: Event) => event.preventDefault()}
>
  {#snippet child({ props, wrapperProps })}
    <div {...wrapperProps}>
      <div
        {...props}
        {@attach closeOnOutsideClick}
        {@attach closeOnEscape}
        {@attach registerContent}
      >
        <!-- the zIndex ensures this menu has higher stacking order,
    see https://github.com/excalidraw/excalidraw/pull/1445 -->
        {#if isPhone}
          <StackCol class="dropdown-menu-container">
            {@render children?.()}
          </StackCol>
        {:else}
          <Island class="dropdown-menu-container" padding={2}>
            {@render children?.()}
          </Island>
        {/if}
      </div>
    </div>
  {/snippet}
</DropdownMenuPrimitive.Content>
