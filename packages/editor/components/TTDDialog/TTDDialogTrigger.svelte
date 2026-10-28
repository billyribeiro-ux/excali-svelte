<script lang="ts">
  import { trackEvent } from "../../analytics";
  import { getTunnels } from "../../context/tunnels";
  import { t } from "../../i18n";
  import TunnelIn from "../../ui/TunnelIn.svelte";
  import { getEditorContext } from "../../ui/editorContext";
  import DropdownMenuItem from "../dropdownMenu/DropdownMenuItem.svelte";
  import DropdownMenuItemBadge from "../dropdownMenu/DropDownMenuItemBadge.svelte";
  import { brainIcon } from "../icons";

  import type { Snippet } from "svelte";
  import type { IconDef } from "../icons";

  let { children, icon }: { children?: Snippet; icon?: IconDef } = $props();

  const { TTDDialogTriggerTunnel } = getTunnels();
  const editor = getEditorContext();
</script>

{#snippet badge()}
  <DropdownMenuItemBadge>AI</DropdownMenuItemBadge>
{/snippet}

<TunnelIn tunnel={TTDDialogTriggerTunnel}>
  <DropdownMenuItem
    onSelect={() => {
      trackEvent("ai", "dialog open", "ttd");
      editor.setAppState({
        openDialog: { name: "ttd", tab: "text-to-diagram" },
      });
    }}
    icon={icon ?? brainIcon}
    {badge}
  >
    {#if children}
      {@render children()}
    {:else}
      {t("labels.textToDiagram")}
    {/if}
  </DropdownMenuItem>
</TunnelIn>
