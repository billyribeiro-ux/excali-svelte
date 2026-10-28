<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { AlignTopIcon } from "../../components/icons";

  import { alignActionsPredicate } from "./predicates";
  import ElementIconButton from "./ElementIconButton.svelte";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();
</script>

<ElementIconButton
  {elements}
  {appState}
  {updateData}
  hidden={!alignActionsPredicate(appState, app)}
  icon={AlignTopIcon}
  title={`${t("labels.alignTop")} — ${getShortcutKey("CtrlOrCmd+Shift+Up")}`}
  label={t("labels.alignTop")}
/>
