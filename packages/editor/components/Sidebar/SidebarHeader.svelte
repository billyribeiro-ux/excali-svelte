<script lang="ts">
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import Button from "../Button.svelte";
  import Icon from "../Icon.svelte";
  import { CloseIcon, PinIcon } from "../icons";
  import Tooltip from "../Tooltip.svelte";

  import { getSidebarPropsContext, hasSidebarPropsContext } from "./common";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type { SidebarPropsContextValue } from "./common";

  let {
    children,
    class: className,
  }: { children?: Snippet; class?: ClassValue } = $props();

  const ctx = getEditorContext();
  const sidebarProps: Partial<SidebarPropsContextValue> = hasSidebarPropsContext()
    ? getSidebarPropsContext()
    : {};

  const renderDockButton = $derived(
    !!(ctx.editorInterface.canFitSidebar && sidebarProps.shouldRenderDockButton),
  );
</script>

<div class={["sidebar__header", className]} data-testid="sidebar-header">
  {@render children?.()}
  <div class="sidebar__header__buttons">
    {#if renderDockButton}
      <Tooltip label={t("labels.sidebarLock")}>
        <Button
          onSelect={() => sidebarProps.onDock?.(!sidebarProps.docked)}
          selected={!!sidebarProps.docked}
          class="sidebar__dock"
          data-testid="sidebar-dock"
          aria-label={t("labels.sidebarLock")}
        >
          <Icon icon={PinIcon} />
        </Button>
      </Tooltip>
    {/if}
    <Button
      data-testid="sidebar-close"
      class="sidebar__close"
      onSelect={() => sidebarProps.onCloseRequest?.()}
      aria-label={t("buttons.close")}
    >
      <Icon icon={CloseIcon} />
    </Button>
  </div>
</div>
