<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { SendBackwardIcon } from "../../components/icons";

  import ZIndexButton from "./ZIndexButton.svelte";

  import type { ActionPanelProps } from "../types";

  let { updateData }: ActionPanelProps = $props();
</script>

<ZIndexButton
  {updateData}
  icon={SendBackwardIcon}
  title={`${t("labels.sendBackward")} — ${getShortcutKey("CtrlOrCmd+[")}`}
/>
