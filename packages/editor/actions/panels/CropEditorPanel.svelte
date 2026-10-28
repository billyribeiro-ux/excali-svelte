<script lang="ts">
  import IconButton from "../../components/IconButton.svelte";
  import { cropIcon } from "../../components/icons";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { updateData }: ActionPanelProps = $props();

  const label = $derived(t("helpDialog.cropStart"));
</script>

<IconButton
  type="button"
  icon={cropIcon}
  title={label}
  aria-label={label}
  onclick={() => updateData(null)}
/>
