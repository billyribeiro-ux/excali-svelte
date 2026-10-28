<script lang="ts">
  import { t } from "../../../i18n";
  import Icon from "../../Icon.svelte";
  import { TrashIcon, codeIcon, stackPushIcon, RetryIcon } from "../../icons";

  import type { TChat, TTTDDialog } from "../types";

  interface Props {
    message: TChat.ChatMessage;
    onMermaidTabClick?: (message: TChat.ChatMessage) => void;
    onAiRepairClick?: (message: TChat.ChatMessage) => void;
    onDeleteMessage?: (messageId: string) => void;
    onInsertMessage?: (message: TChat.ChatMessage) => void;
    onRetry?: (message: TChat.ChatMessage) => void;
    rateLimitRemaining?: number;
    isLastMessage?: boolean;
    renderWarning?: TTTDDialog.renderWarning;
    allowFixingParseError?: boolean;
  }

  let {
    message,
    onMermaidTabClick,
    onAiRepairClick,
    onDeleteMessage,
    onInsertMessage,
    onRetry,
    rateLimitRemaining,
    isLastMessage,
    renderWarning,
    allowFixingParseError,
  }: Props = $props();

  let canRetry = $state(false);

  $effect(() => {
    const error = message.error;
    const lastAttemptAt = message.lastAttemptAt;

    if (!error || !isLastMessage) {
      return;
    }

    if (error && !lastAttemptAt) {
      canRetry = true;
      return;
    }

    const timeSinceLastAttempt = Date.now() - lastAttemptAt!;
    const remainingTime = Math.max(0, 5000 - timeSinceLastAttempt);

    if (remainingTime === 0) {
      canRetry = true;
      return;
    }

    canRetry = false;
    const timer = setTimeout(() => {
      canRetry = true;
    }, remainingTime);

    return () => clearTimeout(timer);
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const customOverride = $derived(
    message.type === "warning" ? renderWarning?.(message) : undefined,
  );
</script>

{#if message.type === "warning"}
  <div class="chat-message chat-message--system">
    <div class="chat-message__content">
      <div class="chat-message__header">
        <span class="chat-message__role">{t("chat.role.system")}</span>
        <span class="chat-message__timestamp">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div class="chat-message__body">
        <div class="chat-message__text">
          {#if typeof customOverride === "string" && customOverride}
            {customOverride}
          {:else if typeof customOverride === "function"}
            {@render customOverride()}
          {:else}
            <!-- no paid plan/upsell exists: every limit shows the general text -->
            {t("chat.rateLimit.generalRateLimit")}
          {/if}
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class={`chat-message chat-message--${message.type}`}>
    <div class="chat-message__content">
      <div class="chat-message__header">
        <span class="chat-message__role">
          {message.type === "user"
            ? t("chat.role.user")
            : t("chat.role.assistant")}
        </span>
        <span class="chat-message__timestamp">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div class="chat-message__body">
        {#if message.error}
          <div class="chat-message__error">{message.content}</div>
          {#if message.errorType !== "parse"}
            <div class="chat-message__error_message">
              Error: {message.error || t("chat.errors.generationFailed")}
            </div>
          {/if}
          {#if message.errorType === "parse" && allowFixingParseError}
            <div class="chat-message__error_message">
              <p>{t("chat.errors.invalidDiagram")}</p>
              <div class="chat-message__error-actions">
                {#if onMermaidTabClick}
                  <button
                    class="chat-message__error-link"
                    onclick={() => onMermaidTabClick(message)}
                    type="button"
                  >
                    {t("chat.errors.fixInMermaid")}
                  </button>
                {/if}
                {#if onAiRepairClick}
                  <button
                    class="chat-message__error-link"
                    onclick={() => onAiRepairClick(message)}
                    disabled={rateLimitRemaining === 0}
                    type="button"
                  >
                    {t("chat.errors.aiRepair")}
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        {:else}
          <div class="chat-message__text">
            {message.content}{#if message.isGenerating}<span
                class="chat-message__cursor">▋</span
              >{/if}
          </div>
        {/if}
      </div>
    </div>
    {#if message.type === "assistant" && !message.isGenerating}
      <div class="chat-message__actions">
        {#if !message.error && onInsertMessage}
          <button
            class="chat-message__action"
            onclick={() => onInsertMessage(message)}
            type="button"
            aria-label={t("chat.insert")}
            title={t("chat.insert")}
          >
            <Icon icon={stackPushIcon} />
          </button>
        {/if}
        {#if onMermaidTabClick && message.content}
          <button
            class="chat-message__action"
            onclick={() => onMermaidTabClick(message)}
            type="button"
            aria-label={t("chat.viewAsMermaid")}
            title={t("chat.viewAsMermaid")}
          >
            <Icon icon={codeIcon} />
          </button>
        {/if}
        {#if onDeleteMessage && message.errorType !== "network"}
          <button
            class="chat-message__action chat-message__action--danger"
            onclick={() => onDeleteMessage(message.id)}
            type="button"
            aria-label={t("chat.deleteMessage")}
            title={t("chat.deleteMessage")}
          >
            <Icon icon={TrashIcon} />
          </button>
        {/if}
        {#if message.errorType === "network" && onRetry && isLastMessage}
          <button
            class={["chat-message__action", { invisible: !canRetry }]}
            onclick={() => onRetry(message)}
            type="button"
            aria-label={t("chat.retry")}
            title={t("chat.retry")}
          >
            <Icon icon={RetryIcon} />
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}
