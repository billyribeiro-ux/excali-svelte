import { useAtom } from "../../../editor-jotai";

import { errorAtom, chatHistoryAtom } from "../TTDContext";

import { useTTDChatStorage } from "../useTTDChatStorage.svelte";

import { getLastAssistantMessage } from "../utils/chat";

import type { SavedChat, TTDPersistenceAdapter } from "../types";

interface UseChatManagementProps {
  persistenceAdapter: TTDPersistenceAdapter;
}

/**
 * Must be called during component initialization.
 */
export const useChatManagement = ({
  persistenceAdapter,
}: UseChatManagementProps) => {
  const error = useAtom(errorAtom);
  const chatHistory = useAtom(chatHistoryAtom);
  let isMenuOpen = $state(false);

  const { restoreChat, deleteChat, createNewChatId } = useTTDChatStorage({
    persistenceAdapter,
  });

  const applyChatToState = (chat: SavedChat) => {
    const restoredMessages = chat.messages.map((msg) => ({
      ...msg,
      timestamp:
        msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
    }));

    const history = {
      id: chat.id,
      messages: restoredMessages,
      currentPrompt: "",
    };

    const lastAssistantMsg = getLastAssistantMessage(history);

    error.current = lastAssistantMsg?.error
      ? new Error(lastAssistantMsg?.error)
      : null;
    chatHistory.current = history;
  };

  const resetChatState = async () => {
    const newSessionId = await createNewChatId();
    chatHistory.current = {
      id: newSessionId,
      messages: [],
      currentPrompt: "",
    };
    error.current = null;
  };

  const onRestoreChat = (chat: SavedChat) => {
    const restoredChat = restoreChat(chat);
    applyChatToState(restoredChat);

    isMenuOpen = false;
  };

  const handleDeleteChat = async (chatId: string, event: MouseEvent) => {
    event.stopPropagation();

    const isDeletingActiveChat = chatId === chatHistory.current.id;
    const updatedChats = await deleteChat(chatId);

    if (isDeletingActiveChat) {
      if (updatedChats.length > 0) {
        const nextChat = updatedChats[0];
        applyChatToState(nextChat);
      } else {
        await resetChatState();
      }
    }
  };

  const handleNewChat = async () => {
    await resetChatState();
    isMenuOpen = false;
  };

  const handleMenuToggle = () => {
    isMenuOpen = !isMenuOpen;
  };

  const handleMenuClose = () => {
    isMenuOpen = false;
  };

  return {
    get isMenuOpen() {
      return isMenuOpen;
    },
    onRestoreChat,
    handleDeleteChat,
    handleNewChat,
    handleMenuToggle,
    handleMenuClose,
  };
};
