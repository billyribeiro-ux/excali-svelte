<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { AlignLeftIcon } from "../../components/icons";

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
  icon={AlignLeftIcon}
  title={`${t("labels.alignLeft")} — ${getShortcutKey("CtrlOrCmd+Shift+Left")}`}
  label={t("labels.alignLeft")}
/>
