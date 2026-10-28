<script lang="ts">
  import IconButton from "../../components/IconButton.svelte";
  import { saveAs } from "../../components/icons";
  import { nativeFileSystemSupported } from "../../data/filesystem";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";

  import type { ActionPanelProps } from "../types";

  let { updateData }: ActionPanelProps = $props();

  const ctx = getEditorContext();
</script>

<IconButton
  type="button"
  icon={saveAs}
  title={t("buttons.saveAs")}
  aria-label={t("buttons.saveAs")}
  showAriaLabel={ctx.editorInterface.formFactor === "phone"}
  hidden={!nativeFileSystemSupported}
  onclick={() => updateData(null)}
  data-testid="save-as-button"
/>
