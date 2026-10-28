<script lang="ts">
  import { getTunnels } from "../../context/tunnels";
  import { getEditorContext } from "../../ui/editorContext";
  import TunnelIn from "../../ui/TunnelIn.svelte";

  import "./FooterCenter.scss";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();

  const tunnels = getTunnels();
  const ctx = getEditorContext();
</script>

<TunnelIn tunnel={tunnels.FooterCenterTunnel}>
  <div
    class={[
      "footer-center zen-mode-transition",
      {
        "layer-ui__wrapper__footer-left--transition-bottom":
          ctx.appState.zenModeEnabled,
      },
    ]}
  >
    {@render children?.()}
  </div>
</TunnelIn>
