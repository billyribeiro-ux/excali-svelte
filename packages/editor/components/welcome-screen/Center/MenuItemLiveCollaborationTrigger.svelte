<script lang="ts">
  import { t } from "../../../i18n";
  import { usersIcon } from "../../icons";

  import MenuItem from "./MenuItem.svelte";

  let { onSelect }: { onSelect: () => any } = $props();
</script>

<MenuItem shortcut={null} {onSelect} icon={usersIcon}>
  {t("labels.liveCollaboration")}
</MenuItem>
