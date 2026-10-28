<script lang="ts">
  import IconButton from "../../components/IconButton.svelte";
  import { done } from "../../components/icons";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { appState, updateData, data }: ActionPanelProps = $props();
</script>

<IconButton
  type="button"
  icon={done}
  title={t("buttons.done")}
  aria-label={t("buttons.done")}
  onclick={(event: MouseEvent) => updateData(event)}
  visible={appState.multiElement != null}
  size={data?.size || "medium"}
  style="pointer-events: all"
/>
