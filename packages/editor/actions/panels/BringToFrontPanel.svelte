<script lang="ts">
  import { isDarwin } from "@svelte-draw/common";
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { BringToFrontIcon } from "../../components/icons";

  import ZIndexButton from "./ZIndexButton.svelte";

  import type { ActionPanelProps } from "../types";

  let { updateData }: ActionPanelProps = $props();
</script>

<ZIndexButton
  {updateData}
  icon={BringToFrontIcon}
  title={`${t("labels.bringToFront")} — ${isDarwin ? getShortcutKey("CtrlOrCmd+Alt+]") : getShortcutKey("CtrlOrCmd+Shift+]")}`}
/>
