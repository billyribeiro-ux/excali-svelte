<script lang="ts">
  import Icon from "./Icon.svelte";

  import type { ClassValue } from "svelte/elements";
  import type { IconDef } from "./icons";

  type Props = {
    icon: IconDef;
    title: string;
    class?: ClassValue;
    testId?: string;
    /** if not supplied, defaults to value identity check */
    active?: boolean;
    onclick: (event: MouseEvent) => void;
    style?: string;
    /** the button element */
    element?: HTMLButtonElement | null;
  };

  let {
    icon,
    title,
    class: className,
    testId,
    active,
    onclick,
    style,
    element = $bindable(null),
  }: Props = $props();
</script>

<button
  type="button"
  {title}
  data-testid={testId}
  class={[className, { active }]}
  {onclick}
  {style}
  bind:this={element}
>
  <Icon {icon} />
</button>
