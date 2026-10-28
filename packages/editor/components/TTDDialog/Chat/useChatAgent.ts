import { useAtom } from "../../../editor-jotai";
import { chatHistoryAtom } from "../../TTDDialog/TTDContext";
import {
  addMessages,
  updateAssistantContent,
} from "../../TTDDialog/utils/chat";

import type { TChat } from "../types";

export const useChatAgent = () => {
  const history = useAtom(chatHistoryAtom);

  const setChatHistory = (
    action: TChat.ChatHistory | ((prev: TChat.ChatHistory) => TChat.ChatHistory),
  ) => {
    history.current =
      typeof action === "function" ? action(history.current) : action;
  };

  const addUserMessage = (content: string) => {
    setChatHistory((prev) =>
      addMessages(prev, [
        {
          type: "user",
          content,
        },
      ]),
    );
  };

  const addAssistantMessage = () => {
    setChatHistory((prev) =>
      addMessages(prev, [
        {
          type: "assistant",
          content: "",
          isGenerating: true,
        },
      ]),
    );
  };

  const setLastRetryAttempt = () => {
    setChatHistory((prev) =>
      updateAssistantContent(prev, {
        lastAttemptAt: Date.now(),
      }),
    );
  };

  const setAssistantError = (
    errorMessage: string,
    errorType: "parse" | "network" | "other" = "other",
    errorDetails?: Error | unknown,
  ) => {
    const serializedErrorDetails = errorDetails
      ? JSON.stringify({
          name: errorDetails instanceof Error ? errorDetails.name : "Error",
          message:
            errorDetails instanceof Error
              ? errorDetails.message
              : String(errorDetails),
          stack: errorDetails instanceof Error ? errorDetails.stack : undefined,
        })
      : undefined;

    setChatHistory((prev) =>
      updateAssistantContent(prev, {
        isGenerating: false,
        error: errorMessage,
        errorType,
        errorDetails: serializedErrorDetails,
      }),
    );
  };

  return {
    addUserMessage,
    addAssistantMessage,
    setAssistantError,
    /** reactive when read inside an effect / template */
    get chatHistory() {
      return history.current;
    },
    setChatHistory,
    setLastRetryAttempt,
  };
};
