<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";
  import DropdownMenu from "../dropdownMenu/DropdownMenu.svelte";
  import DropdownMenuContent from "../dropdownMenu/DropdownMenuContent.svelte";

  import TTDDialogTrigger from "./TTDDialogTrigger.svelte";

  import type { Snippet } from "svelte";
  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    setAppState,
    label,
  }: { setAppState: (update: Record<string, unknown>) => void; label?: Snippet } =
    $props();

  const tunnels = createTunnels();

  /* svelte-ignore state_referenced_locally */
  setEditorContext({
    app: { ownerDocument: document, ownerWindow: window },
    props: {},
    appState: { theme: "light" },
    elements: [],
    editorInterface: { formFactor: "desktop" },
    container: document.body,
    api: null,
    setAppState,
  } as unknown as EditorContextValue);
  setTunnels(tunnels);
</script>

<!-- the host declares the trigger anywhere; it shows up in the menu -->
{#if label}
  <TTDDialogTrigger children={label} />
{:else}
  <TTDDialogTrigger />
{/if}
<DropdownMenu open>
  <DropdownMenuContent>
    <TunnelOut tunnel={tunnels.TTDDialogTriggerTunnel} />
  </DropdownMenuContent>
</DropdownMenu>
