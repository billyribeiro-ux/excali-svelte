<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
  import clsx from "clsx";

  import { getEditorContext } from "../../ui/editorContext";

  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLButtonAttributes } from "svelte/elements";

  type Props = {
    class?: ClassValue;
    children: Snippet;
    onToggle: () => void;
    title?: string;
  } & Omit<HTMLButtonAttributes, "class" | "title" | "children">;

  let {
    class: className = "",
    children,
    onToggle,
    title,
    ...rest
  }: Props = $props();

  const ctx = getEditorContext();

  const classNames = $derived(
    clsx(
      "dropdown-menu-button",
      className,
      "zen-mode-transition",
      {
        "dropdown-menu-button--mobile": ctx.editorInterface.formFactor === "phone",
      },
    ),
  );
</script>

<DropdownMenuPrimitive.Trigger
  class={classNames}
  onclick={onToggle}
  type="button"
  data-testid="dropdown-menu-button"
  {title}
  {...(rest as Record<string, any>)}
>
  {@render children()}
</DropdownMenuPrimitive.Trigger>
