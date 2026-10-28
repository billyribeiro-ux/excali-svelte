<script lang="ts">
  import Icon from "../../components/Icon.svelte";

  import type { IconDef } from "../../components/icons";
  import type { ActionPanelProps } from "../types";

  let {
    updateData,
    icon,
    title,
  }: Pick<ActionPanelProps, "updateData"> & {
    icon: IconDef;
    title: string;
  } = $props();
</script>

<button
  type="button"
  class="zIndexButton"
  onclick={() => updateData(null)}
  {title}
>
  <Icon {icon} />
</button>
