<script lang="ts">
  import { t } from "../i18n";

  import Icon from "./Icon.svelte";
  import { HelpIcon } from "./icons";
  import Tooltip from "./Tooltip.svelte";

  type Props = {
    name?: string;
    id?: string;
    onclick?: () => void;
  };

  let { onclick }: Props = $props();
</script>

<Tooltip label={`${t("helpDialog.title")} — ?`} delay>
  <button
    class="help-icon"
    {onclick}
    type="button"
    aria-label={t("helpDialog.title")}
  >
    <Icon icon={HelpIcon} />
  </button>
</Tooltip>
