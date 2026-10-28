<script lang="ts">
  import { trackEvent } from "@svelte-draw/editor/analytics";
  import FilledButton from "@svelte-draw/editor/components/FilledButton.svelte";
  import {
    LinkIcon,
    playerPlayIcon,
  } from "@svelte-draw/editor/components/icons";
  import { t } from "@svelte-draw/editor/i18n";
  import { getFrame } from "@svelte-draw/common";

  import { isShareLinkConfigured } from "#lib/app/app_config.ts";

  import type { ShareDialogProps } from "./ShareDialog.ts";

  let { collabAPI, type, onExportToBackend, handleClose }: ShareDialogProps =
    $props();
</script>

{#if collabAPI}
  <div class="ShareDialog__picker__header">
    {t("labels.liveCollaboration").replace(/\./g, "")}
  </div>

  <div class="ShareDialog__picker__description">
    <div style="margin-bottom: 1em;">{t("roomDialog.desc_intro")}</div>
    {t("roomDialog.desc_privacy")}
  </div>

  <div class="ShareDialog__picker__button">
    <FilledButton
      size="large"
      label={t("roomDialog.button_startSession")}
      icon={playerPlayIcon}
      onclick={() => {
        trackEvent("share", "room creation", `ui (${getFrame()})`);
        collabAPI.startCollaboration(null);
      }}
    />
  </div>

  {#if type === "share" && isShareLinkConfigured}
    <div class="ShareDialog__separator">
      <span>{t("shareDialog.or")}</span>
    </div>
  {/if}
{/if}

{#if type === "share" && isShareLinkConfigured}
  <div class="ShareDialog__picker__header">
    {t("exportDialog.link_title")}
  </div>
  <div class="ShareDialog__picker__description">
    {t("exportDialog.link_details")}
  </div>

  <div class="ShareDialog__picker__button">
    <FilledButton
      size="large"
      label={t("exportDialog.link_button")}
      icon={LinkIcon}
      onclick={async () => {
        await onExportToBackend();
        handleClose();
      }}
    />
  </div>
{/if}
