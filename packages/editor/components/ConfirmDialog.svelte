<script lang="ts">
  import { editorJotaiStore } from "../editor-jotai";
  import { flushSync } from "../editor/Editor";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Dialog from "./Dialog.svelte";
  import DialogActionButton from "./DialogActionButton.svelte";
  import { isLibraryMenuOpenAtom } from "./LibraryMenu";

  import "./ConfirmDialog.scss";

  import type { ComponentProps } from "svelte";

  type Props = Omit<ComponentProps<typeof Dialog>, "onCloseRequest"> & {
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
  };

  let {
    onConfirm,
    onCancel,
    children,
    confirmText = t("buttons.confirm"),
    cancelText = t("buttons.cancel"),
    class: className = "",
    ...rest
  }: Props = $props();

  const ctx = getEditorContext();

  const closeThen = (callback: () => void) => {
    ctx.setAppState({ openMenu: null });
    editorJotaiStore.set(isLibraryMenuOpenAtom, false);
    // flush any pending updates synchronously,
    // otherwise it could lead to crash in some chromium versions (131.0.6778.86),
    // when `.focus` is invoked with container in some intermediate state
    // (container seems mounted in DOM, but focus still causes a crash)
    flushSync(() => {
      callback();
    });

    ctx.container?.focus();
  };
</script>

<Dialog
  onCloseRequest={onCancel}
  size="small"
  {...rest}
  class={`confirm-dialog ${className}`}
>
  {@render children?.()}
  <div class="confirm-dialog-buttons">
    <DialogActionButton label={cancelText} onclick={() => closeThen(onCancel)} />
    <DialogActionButton
      label={confirmText}
      onclick={() => closeThen(onConfirm)}
      actionType="danger"
    />
  </div>
</Dialog>
