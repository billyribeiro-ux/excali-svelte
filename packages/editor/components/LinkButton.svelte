<script lang="ts">
  import FilledButton from "./FilledButton.svelte";

  import type { Snippet } from "svelte";

  let { href, children }: { href: string; children?: Snippet } = $props();
</script>

<a {href} target="_blank" rel="noopener" class="link-button">
  <FilledButton {children} />
</a>
