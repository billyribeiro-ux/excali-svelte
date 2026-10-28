<script lang="ts">
  import { t } from "../../../i18n";
  import DropdownMenu from "../../dropdownMenu/DropdownMenu.svelte";
  import DropdownMenuContent from "../../dropdownMenu/DropdownMenuContent.svelte";
  import DropdownMenuItemCustom from "../../dropdownMenu/DropdownMenuItemCustom.svelte";
  import DropdownMenuTrigger from "../../dropdownMenu/DropdownMenuTrigger.svelte";
  import FilledButton from "../../FilledButton.svelte";
  import Icon from "../../Icon.svelte";
  import { historyIcon, TrashIcon } from "../../icons";

  import type { SavedChat } from "../types";

  interface Props {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onNewChat: () => void;
    onRestoreChat: (chat: SavedChat) => void;
    onDeleteChat: (chatId: string, event: MouseEvent) => void;
    savedChats: SavedChat[];
    activeSessionId: string;
    disabled?: boolean;
    isNewChatBtnVisible?: boolean;
  }

  let {
    isOpen,
    onToggle,
    onClose,
    onNewChat,
    onRestoreChat,
    onDeleteChat,
    isNewChatBtnVisible,
    savedChats,
    activeSessionId,
    disabled,
  }: Props = $props();
</script>

<div class="ttd-chat-history-menu">
  {#if isNewChatBtnVisible}
    <FilledButton onclick={onNewChat} {disabled}>
      {t("chat.newChat")}
    </FilledButton>
  {/if}
  {#if savedChats.length > 0}
    <div class="ttd-dialog-panel__menu-wrapper">
      <DropdownMenu open={isOpen}>
        <DropdownMenuTrigger
          {onToggle}
          class="ttd-dialog-menu-trigger"
          {disabled}
          title={t("chat.menu")}
          aria-label={t("chat.menu")}
        >
          <Icon icon={historyIcon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent onClickOutside={onClose} onSelect={onClose}>
          {#each savedChats as chat (chat.id)}
            <DropdownMenuItemCustom
              class={[
                "ttd-chat-menu-item",
                { "ttd-chat-menu-item--active": chat.id === activeSessionId },
              ]}
              onclick={() => {
                onRestoreChat(chat);
              }}
            >
              <span class="ttd-chat-menu-item__title">
                {chat.title}
              </span>
              <button
                class="ttd-chat-menu-item__delete"
                onclick={(e) => onDeleteChat(chat.id, e)}
                title={t("chat.deleteChat")}
                aria-label={t("chat.deleteChat")}
                type="button"
              >
                <Icon icon={TrashIcon} />
              </button>
            </DropdownMenuItemCustom>
          {/each}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  {/if}
</div>
