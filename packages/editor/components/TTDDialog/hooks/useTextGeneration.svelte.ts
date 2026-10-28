import { untrack } from "svelte";

import { isFiniteNumber } from "@svelte-draw/math";

import { useAtom } from "../../../editor-jotai";

import { trackEvent } from "../../../analytics";
import { t } from "../../../i18n";

import { errorAtom, rateLimitsAtom, chatHistoryAtom } from "../TTDContext";
import { useChatAgent } from "../Chat/useChatAgent";

import {
  addMessages,
  getLastAssistantMessage,
  getMessagesForLLM,
  removeLastAssistantMessage,
  updateAssistantContent,
} from "../utils/chat";
import { isModuleLoadError } from "../utils/mermaidError";

import type {
  LLMMessage,
  MermaidToExcalidrawLibProps,
  TChat,
  TTTDDialog,
} from "../types";

const MIN_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 10000;

/**
 * Must be called during component initialization (registers an effect).
 * `getOnTextSubmit` / `getMermaidToExcalidrawLib` are getters so that the
 * latest (reactive) prop values are always used.
 */
export const useTextGeneration = ({
  getOnTextSubmit,
  getMermaidToExcalidrawLib,
}: {
  getOnTextSubmit: () => (
    props: TTTDDialog.OnTextSubmitProps,
  ) => Promise<TTTDDialog.OnTextSubmitRetValue>;
  getMermaidToExcalidrawLib: () => MermaidToExcalidrawLibProps;
}) => {
  const error = useAtom(errorAtom);
  const rateLimits = useAtom(rateLimitsAtom);
  const chatHistory = useAtom(chatHistoryAtom);

  const { addUserMessage, addAssistantMessage, setAssistantError } =
    useChatAgent();

  const setError = (value: Error | null) => {
    error.current = value;
  };
  const setChatHistory = (
    fn: (prev: TChat.ChatHistory) => TChat.ChatHistory,
  ) => {
    chatHistory.current = fn(chatHistory.current);
  };

  let streamingAbortController: AbortController | null = null;

  // generated mermaid that couldn't be validated because the lib failed to
  // load (e.g. offline) -> validated once the lib loads
  let pendingValidation = $state<string | null>(null);

  const validateMermaid = async (
    { parseMermaidToExcalidraw }: Awaited<MermaidToExcalidrawLibProps["api"]>,
    mermaidDefinition: string,
  ) => {
    try {
      await parseMermaidToExcalidraw(mermaidDefinition);
      trackEvent("ai", "mermaid parse success", "ttd");
    } catch (err: any) {
      if (isModuleLoadError(err)) {
        // not a syntax error, but a diagram chunk failing to load
        pendingValidation = mermaidDefinition;
        return;
      }
      trackEvent("ai", "mermaid parse failed", "ttd");
      const _error = new Error(
        err.message || t("chat.errors.mermaidParseError"),
      );
      setAssistantError(_error.message, "parse");
      setError(_error);
    }
  };

  $effect(() => {
    const lib = getMermaidToExcalidrawLib();
    const pending = pendingValidation;
    // re-run when the chat changes, like the React dependency list did
    void chatHistory.current;

    if (pending === null || lib.status !== "loaded") {
      return;
    }
    pendingValidation = null;

    // skip if the user has moved on (new generation, switched chats, ...)
    const lastAssistantMessage = getLastAssistantMessage(
      untrack(() => chatHistory.current),
    );
    if (
      lastAssistantMessage?.isGenerating ||
      lastAssistantMessage?.error ||
      (lastAssistantMessage?.content ?? "") !== pending
    ) {
      return;
    }

    lib.api.then(
      (api) => validateMermaid(api, pending),
      () => {},
    );
  });

  const validatePrompt = (prompt: string): boolean => {
    if (
      prompt.length > MAX_PROMPT_LENGTH ||
      prompt.length < MIN_PROMPT_LENGTH ||
      rateLimits.current?.rateLimitRemaining === 0
    ) {
      if (prompt.length < MIN_PROMPT_LENGTH) {
        setError(
          new Error(
            t("chat.errors.promptTooShort", { min: MIN_PROMPT_LENGTH }),
          ),
        );
      }
      if (prompt.length > MAX_PROMPT_LENGTH) {
        setError(
          new Error(t("chat.errors.promptTooLong", { max: MAX_PROMPT_LENGTH })),
        );
      }

      return false;
    }
    return true;
  };

  const onGenerate: TTTDDialog.OnGenerate = async ({
    prompt,
    isRepairFlow = false,
  }) => {
    if (!validatePrompt(prompt)) {
      return;
    }

    // history as of the moment the user hit "generate" (before the new
    // messages are appended)
    const historyBeforeGeneration = untrack(() => chatHistory.current);

    if (streamingAbortController) {
      streamingAbortController.abort();
    }

    setError(null);
    pendingValidation = null;

    const abortController = new AbortController();
    streamingAbortController = abortController;

    if (!isRepairFlow) {
      addUserMessage(prompt);
      addAssistantMessage();
    } else {
      setChatHistory((prev) =>
        updateAssistantContent(prev, {
          isGenerating: true,
          content: "",
          error: undefined,
          errorType: undefined,
          errorDetails: undefined,
        }),
      );
    }

    try {
      trackEvent("ai", "generate", "ttd");

      const previousMessages = getMessagesForLLM(historyBeforeGeneration);

      const messages: LLMMessage[] = [
        ...previousMessages.slice(-3),
        { role: "user", content: prompt },
      ];

      const {
        generatedResponse,
        error: submitError,
        rateLimit,
        rateLimitRemaining,
      } = await getOnTextSubmit()({
        messages,
        onStreamCreated: () => {
          if (isRepairFlow) {
            setChatHistory((prev) =>
              updateAssistantContent(prev, {
                content: "",
                error: "",
                isGenerating: true,
              }),
            );
          }
        },
        onChunk: (chunk: string) => {
          setChatHistory((prev) => {
            const lastAssistantMessage = getLastAssistantMessage(prev);
            return updateAssistantContent(prev, {
              content: lastAssistantMessage.content + chunk,
            });
          });
        },
        signal: abortController.signal,
      });

      setChatHistory((prev) =>
        updateAssistantContent(prev, {
          isGenerating: false,
        }),
      );

      if (isFiniteNumber(rateLimit) && isFiniteNumber(rateLimitRemaining)) {
        rateLimits.current = { rateLimit, rateLimitRemaining };
      }

      if (submitError?.status === 429 || rateLimitRemaining === 0) {
        setChatHistory((history) => {
          if (submitError?.status === 429) {
            history = removeLastAssistantMessage(history);
          }

          history = {
            ...history,
            messages: history.messages.filter(
              (msg) =>
                msg.type !== "warning" ||
                msg.warningType === "rateLimitExceeded" ||
                msg.warningType === "messageLimitExceeded",
            ),
          };
          const withWarning = addMessages(history, [
            {
              type: "warning",
              warningType:
                rateLimitRemaining === 0
                  ? "messageLimitExceeded"
                  : "rateLimitExceeded",
            },
          ]);
          return withWarning;
        });
      }

      if (submitError) {
        const isAborted =
          submitError.name === "AbortError" ||
          submitError.message === "Aborted" ||
          abortController.signal.aborted;

        // do nothing if the request was aborted by the user
        if (isAborted) {
          return;
        }

        const _error = new Error(
          submitError.message || t("chat.errors.requestFailed"),
        );
        if (submitError.status !== 429) {
          setAssistantError(_error.message, "network");
        }
        setError(_error);

        return;
      }

      let api;
      try {
        // the lib may get reloaded (retry) while a generation is in flight, so
        // always validate against the latest one
        api = await getMermaidToExcalidrawLib().api;
      } catch (err: any) {
        console.error("Failed to load mermaid-to-excalidraw", err);
        pendingValidation = generatedResponse ?? "";
        return;
      }

      await validateMermaid(api, generatedResponse ?? "");
    } catch (err: any) {
      const _error = new Error(err.message || t("chat.errors.generationFailed"));
      setAssistantError(_error.message, "other");
      setError(_error);
    } finally {
      streamingAbortController = null;
    }
  };

  const handleAbort = () => {
    if (streamingAbortController) {
      streamingAbortController.abort();
    }
  };

  return {
    onGenerate,
    handleAbort,
  };
};
