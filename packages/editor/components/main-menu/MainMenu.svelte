<script lang="ts">
  import { composeEventHandlers } from "@svelte-draw/common";

  import { getTunnels } from "../../context/tunnels";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import TunnelIn from "../../ui/TunnelIn.svelte";
  import DropdownMenu from "../dropdownMenu/DropdownMenu";
  import { useInternalFallback } from "../hoc/withInternalFallback.svelte";
  import Icon from "../Icon.svelte";
  import { HamburgerMenuIcon } from "../icons";
  import UserList from "../UserList.svelte";

  import type { Snippet } from "svelte";

  type Props = {
    children?: Snippet;
    /**
     * Called when any menu item is selected (clicked on).
     */
    onSelect?: (event: Event) => void;
    /** @private internal, see `useInternalFallback` */
    __fallback?: boolean;
  };

  let { children, onSelect, __fallback }: Props = $props();

  const tunnels = getTunnels();
  const ctx = getEditorContext();
  const fallback = useInternalFallback("MainMenu", () => __fallback);

  const isOpen = $derived(ctx.appState.openMenu === "canvas");
</script>

{#if fallback.shouldRender}
  <TunnelIn tunnel={tunnels.MainMenuTunnel}>
    <DropdownMenu open={isOpen}>
      <DropdownMenu.Trigger
        onToggle={() => {
          ctx.setAppState({
            openMenu: isOpen ? null : "canvas",
            openPopup: null,
            openDialog: null,
          });
        }}
        data-testid="main-menu-trigger"
        class="main-menu-trigger"
      >
        <Icon icon={HamburgerMenuIcon} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        onClickOutside={() => ctx.setAppState({ openMenu: null })}
        onSelect={composeEventHandlers(onSelect, () => {
          ctx.setAppState({ openMenu: null });
        })}
        class="main-menu"
        align="start"
      >
        {@render children?.()}
        {#if ctx.editorInterface.formFactor === "phone" && ctx.appState.collaborators.size > 0}
          <fieldset class="UserList-Wrapper">
            <legend>{t("labels.collaborators")}</legend>
            <UserList
              mobile={true}
              collaborators={ctx.appState.collaborators}
              userToFollow={ctx.props.userToFollow?.socketId || null}
              currentUserControls={ctx.props.currentUserControls}
            />
          </fieldset>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu>
  </TunnelIn>
{/if}
