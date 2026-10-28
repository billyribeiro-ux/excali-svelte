<script lang="ts">
  import { SvelteDraw } from "../index";

  import type { SvelteDrawProps } from "../types";

  let { excalidrawProps = {} }: { excalidrawProps?: SvelteDrawProps } =
    $props();
</script>

<div>
  <SvelteDraw {...excalidrawProps} />
</div>
