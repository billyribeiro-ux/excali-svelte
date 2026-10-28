<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { UngroupIcon } from "../../components/icons";
  import { getSelectedGroupIds } from "@svelte-draw/element";
  import ElementIconButton from "./ElementIconButton.svelte";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData }: ActionPanelProps = $props();
</script>

<ElementIconButton
  {elements}
  {appState}
  {updateData}
  hidden={getSelectedGroupIds(appState).length === 0}
  icon={UngroupIcon({ theme: appState.theme })}
  title={`${t("labels.ungroup")} — ${getShortcutKey("CtrlOrCmd+Shift+G")}`}
  label={t("labels.ungroup")}
/>
