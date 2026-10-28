<script lang="ts">
  import ProjectName from "../../components/ProjectName.svelte";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { updateData, data, app }: ActionPanelProps = $props();
</script>

<ProjectName
  label={t("labels.fileTitle")}
  value={app.getName()}
  onChange={(name: string) => updateData(name)}
  ignoreFocus={data?.ignoreFocus ?? false}
/>
