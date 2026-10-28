<script lang="ts">
  import { getTunnels } from "../../context/tunnels";
  import { t } from "../../i18n";
  import TunnelIn from "../../ui/TunnelIn.svelte";

  import Heading from "./Center/Heading.svelte";
  import Logo from "./Center/Logo.svelte";
  import Menu from "./Center/Menu.svelte";
  import MenuItemHelp from "./Center/MenuItemHelp.svelte";
  import MenuItemLoadScene from "./Center/MenuItemLoadScene.svelte";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();

  const tunnels = getTunnels();
</script>

<TunnelIn tunnel={tunnels.WelcomeScreenCenterTunnel}>
  <div class="welcome-screen-center">
    {#if children}
      {@render children()}
    {:else}
      <Logo />
      <Heading>{t("welcomeScreen.defaults.center_heading")}</Heading>
      <Menu>
        <MenuItemLoadScene />
        <MenuItemHelp />
      </Menu>
    {/if}
  </div>
</TunnelIn>
