<script lang="ts">
  import Icon from "./Icon.svelte";

  import type { IconDef } from "./icons";

  type Props = {
    class?: string;
    icon: IconDef;
    size?: string;
  };

  let { class: className, icon, size = "1em" }: Props = $props();
</script>

<span
  class={className}
  style="width: {size}; height: 100%; margin: 0 0.5ex 0 0.5ex; display: inline-flex; line-height: 0; vertical-align: middle; flex: 0 0 auto;"
>
  <Icon {icon} />
</span>
