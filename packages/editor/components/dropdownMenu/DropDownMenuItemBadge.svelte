<script lang="ts">
  import { THEME } from "@svelte-draw/common";

  import { getEditorContext } from "../../ui/editorContext";

  import { DropDownMenuItemBadgeType } from "./common";

  import type { Snippet } from "svelte";
  import type { ValueOf } from "@svelte-draw/common/utility-types";

  type Props = {
    type?: ValueOf<typeof DropDownMenuItemBadgeType>;
    children: Snippet;
  };

  let { type = DropDownMenuItemBadgeType.BLUE, children }: Props = $props();

  const ctx = getEditorContext();

  const style = $derived.by(() => {
    const base = {
      display: "inline-flex",
      "margin-left": "auto",
      padding: "2px 4px",
      "border-radius": "6px",
      "font-size": "9px",
      "font-family": "Cascadia, monospace",
      border: ctx.appState.theme === THEME.LIGHT ? "1.5px solid white" : "none",
    };

    let colors: Record<string, string>;
    switch (type) {
      case DropDownMenuItemBadgeType.GREEN:
        colors = {
          "background-color": "var(--background-color-badge)",
          color: "var(--color-badge)",
        };
        break;
      case DropDownMenuItemBadgeType.RED:
        colors = {
          "background-color": "pink",
          color: "darkred",
        };
        break;
      case DropDownMenuItemBadgeType.BLUE:
      default:
        colors = {
          background: "var(--color-promo)",
          color: "var(--color-surface-lowest)",
        };
    }

    return Object.entries({ ...base, ...colors })
      .map(([property, value]) => `${property}: ${value}`)
      .join("; ");
  });
</script>

<div class="DropDownMenuItemBadge" {style}>
  {@render children()}
</div>
