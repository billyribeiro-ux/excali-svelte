<script lang="ts">
  import { CLASSES, isDevEnv, KEYS } from "@svelte-draw/common";

  import { useSetAtom } from "../../editor-jotai";
  import { outsideClick } from "../../hooks/outsideClick";
  import { getEditorContext } from "../../ui/editorContext";
  import Island from "../Island.svelte";

  import { isSidebarDockedAtom, setSidebarPropsContext } from "./common";

  import "./Sidebar.scss";

  import type { SidebarProps } from "./common";

  let {
    children,
    onDock,
    docked,
    class: className,
    element = $bindable(null),
  }: SidebarProps = $props();

  const ctx = getEditorContext();

  $effect(() => {
    if (isDevEnv() && onDock && docked == null) {
      console.warn(
        "Sidebar: `docked` must be set when `onDock` is supplied for the sidebar to be user-dockable. To hide this message, either pass `docked` or remove `onDock`",
      );
    }
  });

  const setIsSidebarDocked = useSetAtom(isSidebarDockedAtom);

  $effect.pre(() => {
    setIsSidebarDocked(!!docked);
    return () => {
      setIsSidebarDocked(false);
    };
  });

  // consumed by <Sidebar.Header/>, which can be rendered upstream of this
  // component's markup
  setSidebarPropsContext({
    onCloseRequest: () => {
      ctx.setAppState({ openSidebar: null });
    },
    get onDock() {
      return (isDocked: boolean) => onDock?.(isDocked);
    },
    get docked() {
      return docked;
    },
    // explicit prop to rerender on update
    get shouldRenderDockButton() {
      return !!onDock && docked != null;
    },
  });

  const closeLibrary = () => {
    const isDialogOpen = !!(
      element?.ownerDocument ?? document
    ).querySelector(".Dialog");

    // Prevent closing if any dialog is open
    if (isDialogOpen) {
      return;
    }
    ctx.setAppState({ openSidebar: null });
  };

  const shouldCloseOnDismiss = $derived(
    !docked || !ctx.editorInterface.canFitSidebar,
  );

  const closeOnOutsideClick = outsideClick((event) => {
    // If click on the library icon, do nothing so that LibraryButton
    // can toggle library menu
    if ((event.target as Element).closest(".sidebar-trigger")) {
      return;
    }
    if (shouldCloseOnDismiss) {
      closeLibrary();
    }
  });

  // `Island` doesn't spread attachments, so attach through its element
  $effect(() => {
    if (element) {
      return closeOnOutsideClick(element);
    }
  });

  const isPhone = $derived(ctx.editorInterface.formFactor === "phone");
</script>

<svelte:document
  onkeydown={(event) => {
    if (event.key === KEYS.ESCAPE && shouldCloseOnDismiss) {
      closeLibrary();
    }
  }}
/>

<Island
  class={[CLASSES.SIDEBAR, { "sidebar--docked": docked }, className]}
  bind:element
  data-viewport-ui={!isPhone ? "side" : undefined}
  data-viewport-ui-name={!isPhone ? "sidebar" : undefined}
>
  {@render children?.()}
</Island>
