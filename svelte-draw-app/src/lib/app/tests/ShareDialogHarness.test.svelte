<script lang="ts">
  import { SvelteDraw } from "@svelte-draw/editor";

  import ShareDialog from "#lib/app/share/ShareDialog.svelte";

  import type { CollabAPI } from "#lib/app/collab/Collab.ts";

  let {
    collabAPI = null,
    onExportToBackend,
  }: {
    collabAPI?: CollabAPI | null;
    onExportToBackend: () => void;
  } = $props();
</script>

<SvelteDraw>
  <ShareDialog {collabAPI} {onExportToBackend} />
</SvelteDraw>
