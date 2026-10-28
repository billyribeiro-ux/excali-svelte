<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { DistributeHorizontallyIcon } from "../../components/icons";

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
  icon={DistributeHorizontallyIcon}
  title={`${t("labels.distributeHorizontally")} — ${getShortcutKey("Alt+H")}`}
  label={t("labels.distributeHorizontally")}
/>
