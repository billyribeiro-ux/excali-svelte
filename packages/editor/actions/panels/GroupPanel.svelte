<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { GroupIcon } from "../../components/icons";
  import { enableActionGroup } from "./predicates";
  import ElementIconButton from "./ElementIconButton.svelte";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();
</script>

<ElementIconButton
  {elements}
  {appState}
  {updateData}
  hidden={!enableActionGroup(appState, app)}
  icon={GroupIcon({ theme: appState.theme })}
  title={`${t("labels.group")} — ${getShortcutKey("CtrlOrCmd+G")}`}
  label={t("labels.group")}
/>
