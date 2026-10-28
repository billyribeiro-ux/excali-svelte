<script lang="ts">
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemContentRadio from "../../../dropdownMenu/DropdownMenuItemContentRadio.svelte";
  import { emptyIcon } from "../../../icons";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemContentRadio
  name="boxSelectionMode"
  icon={emptyIcon}
  value={ctx.appState.boxSelectionMode}
  onChange={(value: "contain" | "overlap") => {
    ctx.setAppState({
      boxSelectionMode: value,
    });
  }}
  choices={[
    {
      value: "contain",
      label: t("labels.boxSelectionContain"),
      ariaLabel: t("labels.boxSelectionContain"),
    },
    {
      value: "overlap",
      label: t("labels.boxSelectionOverlap"),
      ariaLabel: t("labels.boxSelectionOverlap"),
    },
  ]}
>
  {t("labels.boxSelectionMode")}
</DropdownMenuItemContentRadio>
