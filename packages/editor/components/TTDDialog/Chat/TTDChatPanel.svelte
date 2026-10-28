<script lang="ts">
  import { useAtom } from "../../../editor-jotai";
  import { t } from "../../../i18n";
  import { ArrowRightIcon } from "../../icons";
  import { rateLimitsAtom } from "../TTDContext";
  import TTDDialogPanel from "../TTDDialogPanel.svelte";

  import ChatHistoryMenu from "./ChatHistoryMenu.svelte";
  import ChatInterface from "./ChatInterface.svelte";

  import type { TTDPanelAction } from "../TTDDialogPanel.svelte";
  import type { SavedChat, TChat, TTTDDialog } from "../types";

  interface Props {
    chatId: string;
    messages: TChat.ChatMessage[];
    currentPrompt: string;
    onPromptChange: (prompt: string) => void;
    onGenerate: TTTDDialog.OnGenerate;
    isGenerating: boolean;
    generatedResponse: string | null | undefined;

    isMenuOpen: boolean;
    onMenuToggle: () => void;
    onMenuClose: () => void;
    onNewChat: () => void;
    onRestoreChat: (chat: SavedChat) => void;
    onDeleteChat: (chatId: string, event: MouseEvent) => void;
    savedChats: SavedChat[];
    activeSessionId: string;

    onAbort: () => void;
    onMermaidTabClick: (message: TChat.ChatMessage) => void;
    onAiRepairClick: (message: TChat.ChatMessage) => void;
    onDeleteMessage: (messageId: string) => void;
    onInsertMessage: (message: TChat.ChatMessage) => void;
    onRetry?: (message: TChat.ChatMessage) => void;

    onViewAsMermaid: () => void;

    renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
    renderWarning?: TTTDDialog.renderWarning;
  }

  let {
    chatId,
    messages,
    currentPrompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    generatedResponse,
    isMenuOpen,
    onMenuToggle,
    onMenuClose,
    onNewChat,
    onRestoreChat,
    onDeleteChat,
    savedChats,
    activeSessionId,
    onAbort,
    onMermaidTabClick,
    onAiRepairClick,
    onDeleteMessage,
    onInsertMessage,
    onRetry,
    onViewAsMermaid,
    renderWelcomeScreen,
    renderWarning,
  }: Props = $props();

  const rateLimitsState = useAtom(rateLimitsAtom);
  const rateLimits = $derived(rateLimitsState.current);

  const actions = $derived.by(() => {
    const result: TTDPanelAction[] = [];
    if (rateLimits) {
      result.push({
        label: t("chat.rateLimitRemaining", {
          count: rateLimits.rateLimitRemaining,
        }),
        variant: "rateLimit",
        className:
          rateLimits.rateLimitRemaining < 5
            ? "ttd-dialog-panel__rate-limit--danger"
            : "",
      });
    }

    if (generatedResponse) {
      result.push({
        action: onViewAsMermaid,
        label: t("chat.viewAsMermaid"),
        icon: ArrowRightIcon,
        iconInline: true,
        variant: "link",
      });
    }

    return result;
  });

  const panelActionFlexProp = $derived.by(() => {
    if (actions.length === 2) {
      return "space-between" as const;
    }
    if (actions.length === 1 && actions[0].variant === "rateLimit") {
      return "flex-start" as const;
    }

    return "flex-end" as const;
  });
</script>

{#snippet panelLabel()}
  <div class="ttd-dialog-panel__label-wrapper">
    <div class="ttd-dialog-panel__label-group"></div>
    <div class="ttd-dialog-panel__header-right">
      <ChatHistoryMenu
        isNewChatBtnVisible={!!messages.length}
        isOpen={isMenuOpen}
        onToggle={onMenuToggle}
        onClose={onMenuClose}
        {onNewChat}
        {onRestoreChat}
        {onDeleteChat}
        {savedChats}
        {activeSessionId}
        disabled={isGenerating}
      />
    </div>
  </div>
{/snippet}

<TTDDialogPanel
  label={panelLabel}
  class="ttd-dialog-chat-panel"
  panelActionJustifyContent={panelActionFlexProp}
  panelActions={actions}
>
  <ChatInterface
    {chatId}
    {messages}
    {currentPrompt}
    {onPromptChange}
    {onGenerate}
    {isGenerating}
    {generatedResponse}
    {onAbort}
    {onMermaidTabClick}
    {onAiRepairClick}
    {onDeleteMessage}
    {onInsertMessage}
    {onRetry}
    {rateLimits}
    {renderWelcomeScreen}
    {renderWarning}
  />
</TTDDialogPanel>
