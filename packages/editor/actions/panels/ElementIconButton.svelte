<script lang="ts">
  import { getNonDeletedElements } from "@svelte-draw/element";

  import IconButton from "../../components/IconButton.svelte";
  import { isSomeElementSelected } from "../../scene";

  import type { IconDef } from "../../components/icons";
  import type { ActionPanelProps } from "../types";

  // shared body of the "icon button that is only visible while elements are
  // selected" panels (align, distribute, group, ungroup)
  let {
    elements,
    appState,
    updateData,
    hidden,
    icon,
    title,
    label,
  }: Pick<ActionPanelProps, "elements" | "appState" | "updateData"> & {
    hidden: boolean;
    icon: IconDef;
    title: string;
    label: string;
  } = $props();
</script>

<IconButton
  {hidden}
  type="button"
  {icon}
  onclick={() => updateData(null)}
  {title}
  aria-label={label}
  visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
/>
