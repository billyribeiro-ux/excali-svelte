<script lang="ts">
  import { getEditorContext } from "../../ui/editorContext";
  import Icon from "../Icon.svelte";

  import "./SidebarTrigger.scss";

  import type { SidebarTriggerProps } from "./common";

  let {
    name,
    tab,
    icon,
    title,
    children,
    onToggle,
    class: className,
    style,
  }: SidebarTriggerProps = $props();

  const ctx = getEditorContext();

  const isOpen = $derived(ctx.appState.openSidebar?.name === name);

  const handleClick = () => {
    (ctx.container ?? document)
      .querySelector(".layer-ui__wrapper")
      ?.classList.remove("animate");
    const nextOpen = !isOpen;
    ctx.setAppState({
      openSidebar: nextOpen ? { name, tab } : null,
      openMenu: null,
      openPopup: null,
    });
    onToggle?.(nextOpen);
  };
</script>

<button
  type="button"
  {title}
  class="sidebar-trigger__label-element"
  aria-label={title}
  aria-keyshortcuts="0"
  aria-pressed={isOpen}
  onclick={handleClick}
>
  <div class={["sidebar-trigger", className]} {style}>
    {#if icon}<div><Icon {icon} /></div>{/if}
    {#if children}<div class="sidebar-trigger__label">{@render children()}</div>{/if}
  </div>
</button>
