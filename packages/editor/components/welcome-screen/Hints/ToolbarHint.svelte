<script lang="ts">
  import { getTunnels } from "../../../context/tunnels";
  import { t } from "../../../i18n";
  import TunnelIn from "../../../ui/TunnelIn.svelte";
  import Icon from "../../Icon.svelte";
  import { WelcomeScreenTopToolbarArrow } from "../../icons";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();

  const tunnels = getTunnels();
</script>

<TunnelIn tunnel={tunnels.WelcomeScreenToolbarHintTunnel}>
  <div
    class="excalifont welcome-screen-decor welcome-screen-decor-hint welcome-screen-decor-hint--toolbar"
  >
    <div class="welcome-screen-decor-hint__label">
      {#if children}
        {@render children()}
      {:else}
        {t("welcomeScreen.defaults.toolbarHint")}
      {/if}
    </div>
    <Icon icon={WelcomeScreenTopToolbarArrow} />
  </div>
</TunnelIn>
