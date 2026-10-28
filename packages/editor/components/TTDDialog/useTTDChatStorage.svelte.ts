import { untrack } from "svelte";

import { randomId } from "@svelte-draw/common";

import { atom, useAtom } from "../../editor-jotai";

import { chatHistoryAtom } from "./TTDContext";

import type { SavedChat, SavedChats, TTDPersistenceAdapter } from "./types";

interface UseTTDChatStorageProps {
  persistenceAdapter: TTDPersistenceAdapter;
}

interface UseTTDChatStorageReturn {
  /** reactive when read inside an effect / template */
  readonly savedChats: SavedChats;
  saveCurrentChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<SavedChats>;
  restoreChat: (chat: SavedChat) => SavedChat;
  createNewChatId: () => Promise<string>;
}

const generateChatTitle = (firstMessage: string): string => {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 50) {
    return trimmed;
  }
  return `${trimmed.substring(0, 47)}...`;
};

// Shared atom for saved chats - starts empty, populated via onLoadChats
export const savedChatsAtom = atom<SavedChats>([]);
export const isLoadingChatsAtom = atom<boolean>(false);
export const chatsLoadedAtom = atom<boolean>(false);

/**
 * Must be called during component initialization (registers effects).
 */
export const useTTDChatStorage = ({
  persistenceAdapter,
}: UseTTDChatStorageProps): UseTTDChatStorageReturn => {
  const chatHistory = useAtom(chatHistoryAtom);
  const savedChats = useAtom(savedChatsAtom);
  const isLoading = useAtom(isLoadingChatsAtom);
  const chatsLoaded = useAtom(chatsLoadedAtom);

  // Load chats on-demand
  const loadChats = async () => {
    if (chatsLoaded.current || isLoading.current) {
      return;
    }

    isLoading.current = true;
    try {
      const chats = await persistenceAdapter.loadChats();
      savedChats.current = chats;
      chatsLoaded.current = true;
    } catch (error) {
      console.warn("Failed to load chats:", error);
      savedChats.current = [];
      chatsLoaded.current = true;
    } finally {
      isLoading.current = false;
    }
  };

  // INITIAL LOAD
  untrack(() => {
    loadChats();
  });

  const saveCurrentChat = async () => {
    const history = untrack(() => chatHistory.current);

    if (history.messages.length === 0) {
      return;
    }

    const firstUserMessage = history.messages.find(
      (msg) => msg.type === "user",
    );
    if (!firstUserMessage || typeof firstUserMessage.content !== "string") {
      return;
    }

    const title = generateChatTitle(firstUserMessage.content);

    const currentSavedChats = untrack(() => savedChats.current);
    const existingChat = currentSavedChats.find(
      (chat) => chat.id === history.id,
    );

    const messagesChanged =
      !existingChat ||
      existingChat.messages.length !== history.messages.length ||
      existingChat.messages.some(
        (msg, i) =>
          msg.id !== history.messages[i]?.id ||
          msg.content !== history.messages[i]?.content,
      );

    const chatToSave: SavedChat = {
      id: history.id,
      title,
      messages: history.messages
        .filter((msg) => msg.type === "user" || msg.type === "assistant")
        .map((msg) => ({
          ...msg,
          timestamp:
            msg.timestamp instanceof Date
              ? msg.timestamp
              : new Date(msg.timestamp),
        })),
      currentPrompt: history.currentPrompt,
      timestamp: messagesChanged
        ? Date.now()
        : existingChat?.timestamp ?? Date.now(),
    };

    const updatedChats = [
      ...currentSavedChats.filter((chat) => chat.id !== history.id),
      chatToSave,
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    savedChats.current = updatedChats;

    try {
      await persistenceAdapter.saveChats(updatedChats);
    } catch (error) {
      console.warn("Failed to save chats:", error);
    }
  };

  // Auto-save when generation completes. Only primitives are derived so the
  // effect re-runs when the message count, the last message id or its
  // generating flag change - not on every streamed chunk.
  const messageCount = $derived(chatHistory.current.messages?.length ?? 0);
  const lastMessageId = $derived(
    chatHistory.current.messages?.[messageCount - 1]?.id,
  );
  const lastMessageGenerating = $derived(
    chatHistory.current.messages?.[messageCount - 1]?.isGenerating,
  );

  $effect(() => {
    void messageCount;
    void lastMessageId;
    if (!lastMessageGenerating) {
      untrack(() => {
        saveCurrentChat();
      });
    }
  });

  const deleteChat = async (chatId: string): Promise<SavedChats> => {
    const updatedChats = untrack(() => savedChats.current).filter(
      (chat) => chat.id !== chatId,
    );
    savedChats.current = updatedChats;

    try {
      await persistenceAdapter.saveChats(updatedChats);
    } catch (error) {
      console.warn("Failed to save after delete:", error);
    }

    return updatedChats;
  };

  const restoreChat = (chat: SavedChat): SavedChat => {
    // Save is handled by the caller after state update
    return chat;
  };

  const createNewChatId = async (): Promise<string> => {
    await saveCurrentChat();
    return randomId();
  };

  return {
    get savedChats() {
      return savedChats.current;
    },
    saveCurrentChat,
    deleteChat,
    restoreChat,
    createNewChatId,
  };
};
