<script lang="ts">
  import { KEYS } from "@svelte-draw/common";

  import { t } from "../../../i18n";
  import InlineIcon from "../../InlineIcon.svelte";
  import { ArrowRightIcon, stop as StopIcon } from "../../icons";
  import TTDWelcomeMessage from "../TTDWelcomeMessage.svelte";

  import ChatMessage from "./ChatMessage.svelte";

  import type { TChat, TTTDDialog } from "../types";

  interface Props {
    chatId: string;
    messages: TChat.ChatMessage[];
    currentPrompt: string;
    onPromptChange: (prompt: string) => void;
    onGenerate: TTTDDialog.OnGenerate;
    isGenerating: boolean;
    rateLimits?: {
      rateLimit: number;
      rateLimitRemaining: number;
    } | null;
    onViewAsMermaid?: () => void;
    generatedResponse?: string | null;
    onAbort?: () => void;
    onMermaidTabClick?: (message: TChat.ChatMessage) => void;
    onAiRepairClick?: (message: TChat.ChatMessage) => void;
    onDeleteMessage?: (messageId: string) => void;
    onInsertMessage?: (message: TChat.ChatMessage) => void;
    onRetry?: (message: TChat.ChatMessage) => void;
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
    rateLimits,
    onAbort,
    onMermaidTabClick,
    onAiRepairClick,
    onDeleteMessage,
    onInsertMessage,
    onRetry,
    renderWelcomeScreen,
    renderWarning,
  }: Props = $props();

  let messagesEnd = $state<HTMLDivElement | null>(null);
  let textarea = $state<HTMLTextAreaElement | null>(null);

  // keep the latest message in view (runs after the DOM was updated)
  $effect(() => {
    void messages;
    messagesEnd?.scrollIntoView();
  });

  $effect(() => {
    void chatId;
    textarea?.focus();
  });

  const handleSubmit = () => {
    if (isGenerating && onAbort) {
      onAbort();
      return;
    }

    const trimmedPrompt = currentPrompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    onGenerate({ prompt: trimmedPrompt });
    onPromptChange("");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === KEYS.ENTER && !event.shiftKey) {
      event.preventDefault();
      if (!isGenerating) {
        handleSubmit();
      }
    }
  };

  const canSend = $derived(
    currentPrompt.trim().length > 3 &&
      !isGenerating &&
      (rateLimits?.rateLimitRemaining ?? 1) > 0,
  );

  const canStop = $derived(isGenerating && !!onAbort);

  const handleInput = (event: Event & { currentTarget: HTMLTextAreaElement }) => {
    const target = event.currentTarget;
    onPromptChange(target.value);
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const welcomeScreen = $derived(
    messages.length === 0
      ? renderWelcomeScreen?.({ rateLimits: rateLimits ?? null })
      : undefined,
  );

  const placeholder = $derived(
    isGenerating
      ? t("chat.generating")
      : rateLimits?.rateLimitRemaining === 0
      ? t("chat.rateLimit.messageLimitInputPlaceholder")
      : messages.length > 0
      ? t("chat.inputPlaceholderWithMessages")
      : t("chat.inputPlaceholder", { shortcut: "Shift + Enter" }),
  );
</script>

<div class="chat-interface">
  <div class="chat-interface__messages">
    {#if messages.length === 0}
      <div class="chat-interface__welcome-screen">
        {#if renderWelcomeScreen}
          {#if typeof welcomeScreen === "string"}
            {welcomeScreen}
          {:else if welcomeScreen}
            {@render welcomeScreen()}
          {/if}
        {:else}
          <TTDWelcomeMessage />
        {/if}
      </div>
    {:else}
      {#each messages as message, index (message.id)}
        <ChatMessage
          {message}
          {onMermaidTabClick}
          {onAiRepairClick}
          {onDeleteMessage}
          {onInsertMessage}
          {onRetry}
          rateLimitRemaining={rateLimits?.rateLimitRemaining}
          isLastMessage={index === messages.length - 1}
          {renderWarning}
          allowFixingParseError={
            // so we don't allow to repair parse errors which aren't the last message
            message.errorType === "parse" && index === messages.length - 1
          }
        />
      {/each}
    {/if}
    <div bind:this={messagesEnd} id="messages-end"></div>
  </div>

  <div class="chat-interface__input-container">
    <div class="chat-interface__input-outer">
      <div
        class="chat-interface__input-wrapper"
        style:border-color={isGenerating ? "var(--dialog-border-color)" : undefined}
      >
        <!-- svelte-ignore a11y_autofocus -->
        <textarea
          bind:this={textarea}
          autofocus
          class="chat-interface__input"
          value={currentPrompt}
          oninput={handleInput}
          onkeydown={handleKeyDown}
          {placeholder}
          disabled={rateLimits?.rateLimitRemaining === 0}
          rows={1}
          cols={30}
        ></textarea>
        <button
          class="chat-interface__send-button"
          onclick={handleSubmit}
          disabled={!canSend && !canStop}
          type="button"
        >
          <InlineIcon size="1.5em" icon={isGenerating ? StopIcon : ArrowRightIcon} />
        </button>
      </div>
    </div>
  </div>
</div>
