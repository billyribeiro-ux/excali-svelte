<script lang="ts">
  import { getTunnels } from "../../../context/tunnels";
  import { t } from "../../../i18n";
  import TunnelIn from "../../../ui/TunnelIn.svelte";
  import Icon from "../../Icon.svelte";
  import { WelcomeScreenHelpArrow } from "../../icons";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();

  const tunnels = getTunnels();
</script>

<TunnelIn tunnel={tunnels.WelcomeScreenHelpHintTunnel}>
  <div
    class="excalifont welcome-screen-decor welcome-screen-decor-hint welcome-screen-decor-hint--help"
  >
    <div>
      {#if children}
        {@render children()}
      {:else}
        {t("welcomeScreen.defaults.helpHint")}
      {/if}
    </div>
    <Icon icon={WelcomeScreenHelpArrow} />
  </div>
</TunnelIn>
