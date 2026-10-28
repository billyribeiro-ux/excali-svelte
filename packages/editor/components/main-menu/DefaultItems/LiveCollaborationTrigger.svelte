<script lang="ts">
  import { t } from "../../../i18n";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { usersIcon } from "../../icons";

  let {
    onSelect,
    isCollaborating,
  }: {
    onSelect: () => void;
    isCollaborating: boolean;
  } = $props();
</script>

<DropdownMenuItem
  data-testid="collab-button"
  icon={usersIcon}
  class={isCollaborating ? "active-collab" : undefined}
  {onSelect}
>
  {t("labels.liveCollaboration")}
</DropdownMenuItem>
