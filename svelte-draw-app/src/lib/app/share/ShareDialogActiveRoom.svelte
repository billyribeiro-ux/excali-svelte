<script lang="ts">
  import { trackEvent } from "@svelte-draw/editor/analytics";
  import { copyTextToSystemClipboard } from "@svelte-draw/editor/clipboard";
  import FilledButton from "@svelte-draw/editor/components/FilledButton.svelte";
  import TextField from "@svelte-draw/editor/components/TextField.svelte";
  import {
    copyIcon,
    playerStopFilledIcon,
    share,
    shareIOS,
    shareWindows,
  } from "@svelte-draw/editor/components/icons";
  import { createCopyStatus } from "@svelte-draw/editor/hooks/copiedIndicator.svelte";
  import { t } from "@svelte-draw/editor/i18n";
  import { KEYS } from "@svelte-draw/common";

  import QRCode from "./QRCode.svelte";

  import type { CollabAPI } from "#lib/app/collab/Collab.ts";

  type Props = {
    collabAPI: CollabAPI;
    activeRoomLink: string;
    handleClose: () => void;
  };

  let { collabAPI, activeRoomLink, handleClose }: Props = $props();

  const getShareIcon = () => {
    const navigator = window.navigator as any;
    const isAppleBrowser = /Apple/.test(navigator.vendor);
    const isWindowsBrowser = navigator.appVersion.indexOf("Win") !== -1;

    if (isAppleBrowser) {
      return shareIOS;
    } else if (isWindowsBrowser) {
      return shareWindows;
    }

    return share;
  };

  let linkInput = $state<HTMLInputElement | null>(null);
  const isShareSupported = "share" in navigator;
  const copy = createCopyStatus();

  const copyRoomLink = async () => {
    try {
      await copyTextToSystemClipboard(activeRoomLink);
    } catch (e) {
      collabAPI.setCollabError(t("errors.copyToSystemClipboardFailed"));
    }

    linkInput?.select();
  };

  const shareRoomLink = async () => {
    try {
      await navigator.share({
        title: t("roomDialog.shareTitle"),
        text: t("roomDialog.shareTitle"),
        url: activeRoomLink,
      });
    } catch (error: any) {
      // Just ignore.
    }
  };
</script>

<h3 class="ShareDialog__active__header">
  {t("labels.liveCollaboration").replace(/\./g, "")}
</h3>
<TextField
  defaultValue={collabAPI.getUsername()}
  placeholder="Your name"
  label="Your name"
  onChange={collabAPI.setUsername}
  onkeydown={(event) => event.key === KEYS.ENTER && handleClose()}
/>
<div class="ShareDialog__active__linkRow">
  <TextField
    bind:element={linkInput}
    label="Link"
    readonly
    fullWidth
    value={activeRoomLink}
  />
  {#if isShareSupported}
    <FilledButton
      size="large"
      variant="icon"
      label="Share"
      icon={getShareIcon()}
      class="ShareDialog__active__share"
      onclick={shareRoomLink}
    />
  {/if}
  <FilledButton
    size="large"
    label={t("buttons.copyLink")}
    icon={copyIcon}
    status={copy.copyStatus}
    onclick={() => {
      copyRoomLink();
      copy.onCopy();
    }}
  />
</div>
<QRCode value={activeRoomLink} />
<div class="ShareDialog__active__description">
  <p>
    <span
      role="img"
      aria-hidden="true"
      class="ShareDialog__active__description__emoji"
    >
      <!-- eslint-disable-next-line svelte/no-useless-mustaches -- literal keeps the trailing space after the emoji -->
      🔒{" "}
    </span>
    {t("roomDialog.desc_privacy")}
  </p>
  <p>{t("roomDialog.desc_exitSession")}</p>
</div>

<div class="ShareDialog__active__actions">
  <FilledButton
    size="large"
    variant="outlined"
    color="danger"
    label={t("roomDialog.button_stopSession")}
    icon={playerStopFilledIcon}
    onclick={() => {
      trackEvent("share", "room closed");
      collabAPI.stopCollaboration();
      if (!collabAPI.isCollaborating()) {
        handleClose();
      }
    }}
  />
</div>
