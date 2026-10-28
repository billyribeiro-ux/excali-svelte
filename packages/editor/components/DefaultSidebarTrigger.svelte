<script lang="ts">
  import { DEFAULT_SIDEBAR } from "@svelte-draw/common";

  import { getTunnels } from "../context/tunnels";
  import TunnelIn from "../ui/TunnelIn.svelte";

  import { useInternalFallback } from "./hoc/withInternalFallback.svelte";
  import { Sidebar } from "./Sidebar/Sidebar";

  import type { SidebarTriggerProps } from "./Sidebar/common";

  type Props = Omit<SidebarTriggerProps, "name" | "class"> & {
    /** @private internal, see `useInternalFallback` */
    __fallback?: boolean;
  };

  let { __fallback, ...props }: Props = $props();

  const tunnels = getTunnels();
  const fallback = useInternalFallback(
    "DefaultSidebarTrigger",
    () => __fallback,
  );
</script>

{#if fallback.shouldRender}
  <TunnelIn tunnel={tunnels.DefaultSidebarTriggerTunnel}>
    <Sidebar.Trigger
      {...props}
      class="default-sidebar-trigger"
      name={DEFAULT_SIDEBAR.name}
    />
  </TunnelIn>
{/if}
