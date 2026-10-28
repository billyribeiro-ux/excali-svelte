<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { DistributeVerticallyIcon } from "../../components/icons";

  import { enableActionDistribute } from "./predicates";
  import ElementIconButton from "./ElementIconButton.svelte";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();
</script>

<ElementIconButton
  {elements}
  {appState}
  {updateData}
  hidden={!enableActionDistribute(appState, app)}
  icon={DistributeVerticallyIcon}
  title={`${t("labels.distributeVertically")} — ${getShortcutKey("Alt+V")}`}
  label={t("labels.distributeVertically")}
/>
