<script lang="ts">
  import { createLibraryItemSvg } from "../hooks/libraryItemSvg.svelte";
  import { getEditorContext } from "../ui/editorContext";

  import CheckboxItem from "./CheckboxItem.svelte";
  import Icon from "./Icon.svelte";
  import { PlusIcon } from "./icons";
    import { hideTooltip, showTooltip } from "./Tooltip";

  import "./LibraryUnit.scss";

  import type { SvgCache } from "../hooks/libraryItemSvg.svelte";
  import type { LibraryItem } from "../types";

  type Props = {
    id: LibraryItem["id"] | /** for pending item */ null;
    name?: LibraryItem["name"];
    /** render larger, with the name below the item */
    showName?: boolean;
    elements?: LibraryItem["elements"];
    isPending?: boolean;
    onClick: (id: LibraryItem["id"] | null) => void;
    selected: boolean;
    onToggle: (id: string, event: MouseEvent) => void;
    onDrag: (id: string, event: DragEvent) => void;
    svgCache: SvgCache;
  };

  let {
    id,
    name,
    showName,
    elements,
    isPending,
    onClick,
    selected,
    onToggle,
    onDrag,
    svgCache,
  }: Props = $props();

  const ctx = getEditorContext();

  let isHovered = $state(false);

  // preview svg (cached per item id); `item.attachment` renders it into a node
  const item = createLibraryItemSvg(() => ({ id, elements, svgCache }));

  const isMobile = $derived(ctx.editorInterface.formFactor === "phone");
  const hasName = $derived(!!name?.trim());

  const onPointerEnter = (event: PointerEvent & { currentTarget: HTMLElement }) => {
    const nameEl = showName
      ? event.currentTarget.querySelector(".library-unit__name")
      : null;
    // name is already shown below the item, unless truncated
    if (nameEl && nameEl.scrollWidth <= nameEl.clientWidth) {
      return;
    }
    showTooltip(event.currentTarget, name!, {
      delay: true,
      position: "top",
    });
  };

  const onDraggerClick = (event: MouseEvent) => {
    if (id && event.shiftKey) {
      onToggle(id, event);
    } else {
      onClick(id);
    }
  };

  const onDragStart = (event: DragEvent) => {
    if (!id) {
      event.preventDefault();
      return;
    }
    isHovered = false;
    onDrag(id, event);
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={[
    "library-unit",
    {
      "library-unit__active": elements,
      "library-unit--hover": elements && isHovered,
      "library-unit--selected": selected,
      "library-unit--skeleton": !item.svg,
      "library-unit--named": showName,
    },
  ]}
  onmouseenter={() => (isHovered = true)}
  onmouseleave={() => (isHovered = false)}
  onpointerenter={hasName ? onPointerEnter : undefined}
  onpointerleave={hasName ? hideTooltip : undefined}
  onpointerdown={hasName ? hideTooltip : undefined}
>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class={["library-unit__dragger", { "library-unit__pulse": !!isPending }]}
    draggable={!!elements}
    onclick={!!elements || !!isPending ? onDraggerClick : undefined}
    ondragstart={onDragStart}
    {@attach showName ? undefined : item.attachment}
  >
    {#if showName}
      <div class="library-unit__preview" {@attach item.attachment}></div>
      <div class="library-unit__name">{name}</div>
    {/if}
  </div>
  {#if isPending}
    <div class="library-unit__adder"><Icon icon={PlusIcon} /></div>
  {/if}
  {#if id && elements && (isHovered || isMobile || selected)}
    <CheckboxItem
      checked={selected}
      onChange={(_checked: boolean, event: MouseEvent) => onToggle(id, event)}
      class="library-unit__checkbox"
    />
  {/if}
</div>
