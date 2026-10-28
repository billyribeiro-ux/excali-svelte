<script lang="ts">
  import { useAtom } from "../../editor-jotai";
  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";

  import {
    convertMermaidToExcalidraw,
    insertToEditor,
    saveMermaidDataToStorage,
  } from "./common";
  import { errorAtom, chatHistoryAtom, showPreviewAtom } from "./TTDContext";
  import TTDChatPanel from "./Chat/TTDChatPanel.svelte";
  import { useChatAgent } from "./Chat/useChatAgent";
  import { useChatManagement } from "./hooks/useChatManagement.svelte";
  import { useMermaidRenderer } from "./hooks/useMermaidRenderer.svelte";
  import { useTextGeneration } from "./hooks/useTextGeneration.svelte";
  import TTDPreviewPanel from "./TTDPreviewPanel.svelte";
  import { useTTDChatStorage } from "./useTTDChatStorage.svelte";
  import { getLastAssistantMessage } from "./utils/chat";

  import type { MermaidData } from "./types";
  import type {
    MermaidToExcalidrawLibProps,
    TChat,
    TTDPersistenceAdapter,
    TTTDDialog,
  } from "./types";

  interface Props {
    mermaidToExcalidrawLib: MermaidToExcalidrawLibProps;
    onRetryLoad?: () => void;
    onTextSubmit: (
      props: TTTDDialog.OnTextSubmitProps,
    ) => Promise<TTTDDialog.OnTextSubmitRetValue>;
    renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
    renderWarning?: TTTDDialog.renderWarning;
    persistenceAdapter: TTDPersistenceAdapter;
  }

  let {
    mermaidToExcalidrawLib,
    onRetryLoad,
    onTextSubmit,
    renderWelcomeScreen,
    renderWarning,
    persistenceAdapter,
  }: Props = $props();

  const editor = getEditorContext();

  let canvasEl = $state<HTMLDivElement | null>(null);
  const canvasRef = {
    get current() {
      return canvasEl;
    },
  };

  const error = useAtom(errorAtom);
  const chatHistory = useAtom(chatHistoryAtom);
  const showPreview = useAtom(showPreviewAtom);

  // the persistence adapter is expected to be stable (see `types.ts`), so it
  // is read once during initialization
  /* svelte-ignore state_referenced_locally */
  const storage = useTTDChatStorage({ persistenceAdapter });

  const lastAssistantMessage = $derived(
    getLastAssistantMessage(chatHistory.current),
  );

  const { setLastRetryAttempt } = useChatAgent();

  const { data } = useMermaidRenderer({
    getMermaidToExcalidrawLib: () => mermaidToExcalidrawLib,
    getCanvas: () => canvasEl,
    getTheme: () => editor.appState.theme,
  });

  const { onGenerate, handleAbort } = useTextGeneration({
    getOnTextSubmit: () => onTextSubmit,
    getMermaidToExcalidrawLib: () => mermaidToExcalidrawLib,
  });

  /* svelte-ignore state_referenced_locally */
  const chatManagement = useChatManagement({ persistenceAdapter });

  const onViewAsMermaid = () => {
    if (typeof lastAssistantMessage?.content === "string") {
      saveMermaidDataToStorage(lastAssistantMessage.content);
      editor.setAppState({
        openDialog: { name: "ttd", tab: "mermaid" },
      });
    }
  };

  const handleMermaidTabClick = (message: TChat.ChatMessage) => {
    const mermaidContent = message.content || "";
    if (mermaidContent) {
      saveMermaidDataToStorage(mermaidContent);
      editor.setAppState({
        openDialog: { name: "ttd", tab: "mermaid" },
      });
    }
  };

  const handleInsertMessage = async (message: TChat.ChatMessage) => {
    const mermaidContent = message.content || "";
    if (!mermaidContent.trim()) {
      return;
    }

    if (mermaidToExcalidrawLib.status !== "loaded") {
      if (mermaidToExcalidrawLib.status === "error") {
        editor.setAppState({
          toast: {
            message: mermaidToExcalidrawLib.reloadRequired
              ? t("mermaid.loadErrorReload")
              : t("mermaid.loadError"),
            closable: true,
          },
        });
      }
      return;
    }

    const tempDataRef: { current: MermaidData } = {
      current: {
        elements: [],
        files: null,
      },
    };

    const result = await convertMermaidToExcalidraw({
      canvasRef,
      data: tempDataRef,
      mermaidToExcalidrawLib,
      setError: (value) => {
        error.current = value;
      },
      mermaidDefinition: mermaidContent,
      theme: editor.app.state.theme,
    });

    if (result.success) {
      insertToEditor({
        app: editor.app,
        data: tempDataRef,
        text: mermaidContent,
        shouldSaveMermaidDataToStorage: true,
      });
    }
  };

  const handleAiRepairClick = async (message: TChat.ChatMessage) => {
    const mermaidContent = message.content || "";
    const errorMessage = message.error || "";

    if (!mermaidContent) {
      return;
    }

    const repairPrompt = `Fix the error in this Mermaid diagram. The diagram is:\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\`\n\nThe exception/error is: ${errorMessage}\n\nPlease fix the Mermaid syntax and regenerate a valid diagram.`;

    await onGenerate({ prompt: repairPrompt, isRepairFlow: true });
  };

  const handleRetry = async (message: TChat.ChatMessage) => {
    const messageIndex = chatHistory.current.messages.findIndex(
      (msg) => msg.id === message.id,
    );

    if (messageIndex > 0) {
      const previousMessage = chatHistory.current.messages[messageIndex - 1];
      if (
        previousMessage.type === "user" &&
        typeof previousMessage.content === "string"
      ) {
        setLastRetryAttempt();
        await onGenerate({
          prompt: previousMessage.content,
          isRepairFlow: true,
        });
      }
    }
  };

  const handleInsertToEditor = () => {
    insertToEditor({ app: editor.app, data });
  };

  const handleDeleteMessage = (messageId: string) => {
    const assistantMessageIndex = chatHistory.current.messages.findIndex(
      (msg) => msg.id === messageId && msg.type === "assistant",
    );

    const remainingMessages = chatHistory.current.messages.slice(
      0,
      assistantMessageIndex - 1,
    );

    chatHistory.current = {
      ...chatHistory.current,
      messages: remainingMessages,
    };
  };

  const handlePromptChange = (newPrompt: string) => {
    chatHistory.current = {
      ...chatHistory.current,
      currentPrompt: newPrompt,
    };
  };
</script>

<div
  class={[
    "ttd-dialog-layout",
    showPreview.current
      ? "ttd-dialog-layout--split"
      : "ttd-dialog-layout--chat-only",
  ]}
>
  <TTDChatPanel
    chatId={chatHistory.current.id}
    messages={chatHistory.current.messages}
    currentPrompt={chatHistory.current.currentPrompt}
    onPromptChange={handlePromptChange}
    {onGenerate}
    isGenerating={lastAssistantMessage?.isGenerating ?? false}
    generatedResponse={lastAssistantMessage?.content}
    isMenuOpen={chatManagement.isMenuOpen}
    onMenuToggle={chatManagement.handleMenuToggle}
    onMenuClose={chatManagement.handleMenuClose}
    onNewChat={chatManagement.handleNewChat}
    onRestoreChat={chatManagement.onRestoreChat}
    onDeleteChat={chatManagement.handleDeleteChat}
    savedChats={storage.savedChats}
    activeSessionId={chatHistory.current.id}
    onAbort={handleAbort}
    onMermaidTabClick={handleMermaidTabClick}
    onAiRepairClick={handleAiRepairClick}
    onDeleteMessage={handleDeleteMessage}
    onInsertMessage={handleInsertMessage}
    onRetry={handleRetry}
    {onViewAsMermaid}
    {renderWarning}
    {renderWelcomeScreen}
  />
  {#if showPreview.current}
    <TTDPreviewPanel
      bind:canvasEl
      hideErrorDetails={lastAssistantMessage?.errorType === "parse"}
      error={error.current}
      loadStatus={mermaidToExcalidrawLib.status}
      loadErrorReloadRequired={mermaidToExcalidrawLib.reloadRequired}
      {onRetryLoad}
      onInsert={handleInsertToEditor}
    />
  {/if}
</div>
