<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import clsx from "clsx";

  import { getEditorContext } from "../../ui/editorContext";
  import Island from "../Island.svelte";
  import StackCol from "../StackCol.svelte";

  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  const BASE_ALIGN_OFFSET = -4;
  const BASE_SIDE_OFFSET = 4;

  type Props = {
    children?: Snippet;
    class?: string;
  };

  let { children, class: className }: Props = $props();

  const ctx = getEditorContext();

  const isPhone = $derived(ctx.editorInterface.formFactor === "phone");

  const classNames = $derived(
    clsx("dropdown-menu dropdown-submenu", className, {
      "dropdown-menu--mobile": isPhone,
    }),
  );

  let sideOffset = $state(BASE_SIDE_OFFSET);
  let alignOffset = $state(BASE_ALIGN_OFFSET);

  // flips the submenu back into the viewport when it would overflow on the
  // right (runs once when the submenu node is mounted)
  const keepInViewport: Attachment<HTMLElement> = (node) => {
    const parentContainer = node.closest(".dropdown-menu-container");
    const parentRect = parentContainer?.getBoundingClientRect();
    if (parentRect) {
      const menuWidth = node.getBoundingClientRect().width;

      const viewportWidth = node.ownerDocument.defaultView?.innerWidth ?? 0;
      const spaceRemaining = viewportWidth - parentRect.right;
      if (spaceRemaining < menuWidth + 20) {
        sideOffset = spaceRemaining - menuWidth + BASE_ALIGN_OFFSET;
        alignOffset = BASE_ALIGN_OFFSET + 8;
      }
    }
  };
</script>

<DropdownMenuPrimitive.SubContent
  class={classNames}
  {sideOffset}
  {alignOffset}
  collisionPadding={8}
>
  {#snippet child({ props, wrapperProps })}
    <div {...wrapperProps}>
      <div {...props} {@attach keepInViewport}>
        {#if isPhone}
          <StackCol class="dropdown-menu-container">
            {@render children?.()}
          </StackCol>
        {:else}
          <Island class="dropdown-menu-container" padding={2} style="z-index: 1;">
            {@render children?.()}
          </Island>
        {/if}
      </div>
    </div>
  {/snippet}
</DropdownMenuPrimitive.SubContent>
