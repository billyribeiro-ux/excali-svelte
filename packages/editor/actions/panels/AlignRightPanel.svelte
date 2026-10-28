<script lang="ts">
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { AlignRightIcon } from "../../components/icons";

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
  icon={AlignRightIcon}
  title={`${t("labels.alignRight")} — ${getShortcutKey("CtrlOrCmd+Shift+Right")}`}
  label={t("labels.alignRight")}
/>
