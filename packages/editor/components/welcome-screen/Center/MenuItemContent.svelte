<script lang="ts">
  import { getEditorContext } from "../../../ui/editorContext";
  import Icon from "../../Icon.svelte";

  import type { Snippet } from "svelte";
  import type { IconDef } from "../../icons";

  let {
    icon,
    shortcut,
    children,
  }: {
    icon?: IconDef;
    shortcut?: string | null;
    children: Snippet;
  } = $props();

  const ctx = getEditorContext();
</script>

<div class="welcome-screen-menu-item__icon">
  {#if icon}<Icon {icon} />{/if}
</div>
<div class="welcome-screen-menu-item__text">{@render children()}</div>
{#if shortcut && ctx.editorInterface.formFactor !== "phone"}
  <div class="welcome-screen-menu-item__shortcut">{shortcut}</div>
{/if}
