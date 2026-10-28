<script lang="ts" module>
  export type ShareableLinkDialogProps = {
    link: string;
    onCloseRequest: () => void;
    setErrorMessage: (error: string) => void;
  };
</script>

<script lang="ts">
  import { copyTextToSystemClipboard } from "../clipboard";
  import { t } from "../i18n";

  import Dialog from "./Dialog.svelte";
  import FilledButton from "./FilledButton.svelte";
  import TextField from "./TextField.svelte";
  import { copyIcon } from "./icons";

  import "./ShareableLinkDialog.scss";

  const COPY_STATUS_TIMEOUT = 2000;

  let { link, onCloseRequest, setErrorMessage }: ShareableLinkDialogProps =
    $props();

  let linkRow: HTMLDivElement | undefined = $state();
  let copyStatus = $state<"success" | null>(null);
  let copyTimeout = 0;

  $effect(() => () => window.clearTimeout(copyTimeout));

  const onCopy = () => {
    window.clearTimeout(copyTimeout);
    copyStatus = "success";
    copyTimeout = window.setTimeout(() => {
      copyStatus = null;
    }, COPY_STATUS_TIMEOUT);
  };

  const copyRoomLink = async () => {
    try {
      await copyTextToSystemClipboard(link);
    } catch {
      setErrorMessage(t("errors.copyToSystemClipboardFailed"));
    }
    linkRow?.querySelector("input")?.select();
  };
</script>

<Dialog {onCloseRequest} title={false} size="small">
  <div class="ShareableLinkDialog">
    <h3>Shareable link</h3>
    <div class="ShareableLinkDialog__linkRow" bind:this={linkRow}>
      <TextField label="Link" readonly fullWidth value={link} selectOnRender />
      <FilledButton
        size="large"
        label={t("buttons.copyLink")}
        icon={copyIcon}
        status={copyStatus}
        onclick={() => {
          onCopy();
          copyRoomLink();
        }}
      />
    </div>
    <div class="ShareableLinkDialog__description">
      🔒 {t("alerts.uploadedSecurly")}
    </div>
  </div>
</Dialog>
