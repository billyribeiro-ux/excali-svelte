<script lang="ts">
  import type { Snippet } from "svelte";

  import type { Tunnel } from "./Tunnel.svelte";

  let { tunnel, children }: { tunnel: Tunnel; children: Snippet } = $props();

  let id: number | null = null;

  $effect(() => {
    // register once, keep the content in sync when the snippet identity changes
    if (id === null) {
      id = tunnel.add(children);
    } else {
      tunnel.update(id, children);
    }
  });

  $effect(() => {
    return () => {
      if (id !== null) {
        tunnel.remove(id);
        id = null;
      }
    };
  });
</script>
