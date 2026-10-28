<script lang="ts">
  import { portal } from "./portal";

  let { to }: { to: HTMLElement } = $props();
</script>

<div class="portaled" {@attach portal(to)}>hello</div>
