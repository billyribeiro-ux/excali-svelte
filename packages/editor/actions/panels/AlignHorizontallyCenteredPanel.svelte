<script lang="ts">
  import { t } from "../../i18n";
  import { CenterHorizontallyIcon } from "../../components/icons";

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
  icon={CenterHorizontallyIcon}
  title={t("labels.centerHorizontally")}
  label={t("labels.centerHorizontally")}
/>
