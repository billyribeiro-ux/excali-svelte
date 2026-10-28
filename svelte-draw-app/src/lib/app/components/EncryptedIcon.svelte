<script lang="ts">
  import { t } from "@svelte-draw/editor/i18n";
  import Icon from "@svelte-draw/editor/components/Icon.svelte";
  import Tooltip from "@svelte-draw/editor/components/Tooltip.svelte";
  import { shield } from "@svelte-draw/editor/components/icons";

  import { REPOSITORY_URL } from "#lib/app/app_constants.ts";
</script>

<a
  class="encrypted-icon tooltip"
  href={REPOSITORY_URL || undefined}
  target="_blank"
  rel="noopener"
  aria-label={t("encrypted.link")}
>
  <Tooltip label={t("encrypted.tooltip")} long={true}>
    <Icon icon={shield} />
  </Tooltip>
</a>
