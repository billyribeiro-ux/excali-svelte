<script lang="ts">
  import type { IconDef } from "./icons";

  type Props = { icon: IconDef };

  let { icon }: Props = $props();
</script>

<!--
  Renders the icon's complete `<svg>` markup directly, without a wrapper
  element, so selectors such as `.ToolIcon__icon svg` keep working.

  `{@html}` is safe here because `IconDef.html` is trusted static markup that
  is generated from our own source (`icons.ts`) or built by `createIcon` from
  developer-supplied constants; it never contains user input.
-->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html icon.html}
