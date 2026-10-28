<script lang="ts">
  import { getNonDeletedElements, isEmbeddableElement } from "@svelte-draw/element";

  import IconButton from "../../components/IconButton.svelte";
  import { getContextMenuLabel } from "../../components/hyperlink/Hyperlink";
  import { LinkIcon } from "../../components/icons";
  import { t } from "../../i18n";
  import { getSelectedElements } from "../../scene";
  import { getShortcutKey } from "../../shortcut";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData }: ActionPanelProps = $props();

  const selectedElements = $derived(getSelectedElements(elements, appState));
</script>

<IconButton
  type="toggle"
  icon={LinkIcon}
  aria-label={t(getContextMenuLabel(getNonDeletedElements(elements), appState))}
  title={`${
    isEmbeddableElement(elements[0])
      ? t("labels.link.labelEmbed")
      : t("labels.link.label")
  } - ${getShortcutKey("CtrlOrCmd+K")}`}
  onSelect={() => updateData(null)}
  checked={selectedElements.length === 1 && !!selectedElements[0].link}
/>
