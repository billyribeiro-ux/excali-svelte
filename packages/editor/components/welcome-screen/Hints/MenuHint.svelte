<script lang="ts">
  import { getTunnels } from "../../../context/tunnels";
  import { t } from "../../../i18n";
  import TunnelIn from "../../../ui/TunnelIn.svelte";
  import Icon from "../../Icon.svelte";
  import { WelcomeScreenMenuArrow } from "../../icons";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();

  const tunnels = getTunnels();
</script>

<TunnelIn tunnel={tunnels.WelcomeScreenMenuHintTunnel}>
  <div
    class="excalifont welcome-screen-decor welcome-screen-decor-hint welcome-screen-decor-hint--menu"
  >
    <Icon icon={WelcomeScreenMenuArrow} />
    <div class="welcome-screen-decor-hint__label">
      {#if children}
        {@render children()}
      {:else}
        {t("welcomeScreen.defaults.menuHint")}
      {/if}
    </div>
  </div>
</TunnelIn>
