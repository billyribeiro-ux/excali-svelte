<script lang="ts">
  import { getEditorContext } from "../../ui/editorContext";
  import Ellipsify from "../Ellipsify.svelte";
  import Icon from "../Icon.svelte";

  import type { Snippet } from "svelte";
  import type { IconDef } from "../icons";

  type Props = {
    icon?: IconDef;
    shortcut?: string;
    /** inline CSS string (React took a CSSProperties object) */
    textStyle?: string;
    children: Snippet;
    badge?: Snippet;
  };

  let { textStyle, icon, shortcut, children, badge }: Props = $props();

  const ctx = getEditorContext();
</script>

{#if icon}
  <div class="dropdown-menu-item__icon"><Icon {icon} /></div>
{/if}
<div style={textStyle} class="dropdown-menu-item__text">
  <Ellipsify>{@render children()}</Ellipsify>
</div>
{#if badge}
  <div class="dropdown-menu-item__badge">{@render badge()}</div>
{/if}
{#if shortcut && ctx.editorInterface.formFactor !== "phone"}
  <div class="dropdown-menu-item__shortcut">{shortcut}</div>
{/if}
