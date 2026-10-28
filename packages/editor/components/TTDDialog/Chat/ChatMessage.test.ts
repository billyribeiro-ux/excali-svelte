import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { t } from "../../../i18n";

import ChatMessage from "./ChatMessage.svelte";

import type { TChat } from "../types";

const makeMessage = (
  overrides: Partial<TChat.ChatMessage> = {},
): TChat.ChatMessage => ({
  id: "m1",
  timestamp: new Date(2024, 0, 1, 10, 30),
  type: "assistant",
  content: "flowchart TD\n A-->B",
  ...overrides,
});

describe("<ChatMessage />", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a user message with role, time and text", () => {
    render(ChatMessage, {
      message: makeMessage({ type: "user", content: "draw it" }),
    });
    expect(document.querySelector(".chat-message")).toHaveClass(
      "chat-message--user",
    );
    expect(document.querySelector(".chat-message__role")).toHaveTextContent(
      "You",
    );
    expect(
      document.querySelector(".chat-message__timestamp")?.textContent,
    ).toBe(
      new Date(2024, 0, 1, 10, 30).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    expect(document.querySelector(".chat-message__text")).toHaveTextContent(
      "draw it",
    );
    // only assistant messages have actions
    expect(document.querySelector(".chat-message__actions")).toBeNull();
  });

  it("renders the streaming cursor and no actions while generating", () => {
    render(ChatMessage, {
      message: makeMessage({ content: "flow", isGenerating: true }),
      onInsertMessage: () => {},
    });
    expect(document.querySelector(".chat-message__cursor")).toHaveTextContent(
      "▋",
    );
    expect(document.querySelector(".chat-message__actions")).toBeNull();
  });

  it("updates the text and drops the cursor when streaming finishes", async () => {
    const { rerender } = render(ChatMessage, {
      message: makeMessage({ content: "flow", isGenerating: true }),
    });
    expect(document.querySelector(".chat-message__text")).toHaveTextContent(
      "flow▋",
    );
    await rerender({
      message: makeMessage({ content: "flowchart TD", isGenerating: false }),
    });
    expect(document.querySelector(".chat-message__text")).toHaveTextContent(
      "flowchart TD",
    );
    expect(document.querySelector(".chat-message__cursor")).toBeNull();
  });

  it("wires up the assistant action buttons", async () => {
    const onInsertMessage = vi.fn();
    const onMermaidTabClick = vi.fn();
    const onDeleteMessage = vi.fn();
    const message = makeMessage();
    render(ChatMessage, {
      message,
      onInsertMessage,
      onMermaidTabClick,
      onDeleteMessage,
    });

    await fireEvent.click(screen.getByRole("button", { name: "Insert" }));
    await fireEvent.click(screen.getByRole("button", { name: "View as Mermaid" }));
    await fireEvent.click(screen.getByRole("button", { name: "Delete message" }));

    expect(onInsertMessage).toHaveBeenCalledWith(message);
    expect(onMermaidTabClick).toHaveBeenCalledWith(message);
    expect(onDeleteMessage).toHaveBeenCalledWith("m1");
  });

  describe("errors", () => {
    it("shows the error of a failed request and hides the insert action", () => {
      render(ChatMessage, {
        message: makeMessage({
          content: "partial",
          error: "Network down",
          errorType: "network",
        }),
        onInsertMessage: () => {},
        onDeleteMessage: () => {},
        onRetry: () => {},
        isLastMessage: true,
      });
      expect(document.querySelector(".chat-message__error")).toHaveTextContent(
        "partial",
      );
      expect(
        document.querySelector(".chat-message__error_message"),
      ).toHaveTextContent("Error: Network down");
      expect(screen.queryByRole("button", { name: "Insert" })).toBeNull();
      // network errors are retried, not deleted
      expect(screen.queryByRole("button", { name: "Delete message" })).toBeNull();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("offers fix actions for a parse error of the last message", async () => {
      const onMermaidTabClick = vi.fn();
      const onAiRepairClick = vi.fn();
      const message = makeMessage({ error: "bad", errorType: "parse" });
      render(ChatMessage, {
        message,
        onMermaidTabClick,
        onAiRepairClick,
        allowFixingParseError: true,
        rateLimitRemaining: 3,
      });
      expect(
        document.querySelector(".chat-message__error_message p"),
      ).toHaveTextContent("Generated an invalid diagram");

      const [fixInMermaid, aiRepair] = document.querySelectorAll<HTMLButtonElement>(
        ".chat-message__error-link",
      );
      await fireEvent.click(fixInMermaid);
      await fireEvent.click(aiRepair);
      expect(onMermaidTabClick).toHaveBeenCalledWith(message);
      expect(onAiRepairClick).toHaveBeenCalledWith(message);
    });

    it("hides the fix actions of older parse errors and disables AI repair at the rate limit", () => {
      const { unmount } = render(ChatMessage, {
        message: makeMessage({ error: "bad", errorType: "parse" }),
        onMermaidTabClick: () => {},
        onAiRepairClick: () => {},
        allowFixingParseError: false,
      });
      expect(document.querySelector(".chat-message__error-link")).toBeNull();
      unmount();

      render(ChatMessage, {
        message: makeMessage({ error: "bad", errorType: "parse" }),
        onMermaidTabClick: () => {},
        onAiRepairClick: () => {},
        allowFixingParseError: true,
        rateLimitRemaining: 0,
      });
      const [, aiRepair] = document.querySelectorAll<HTMLButtonElement>(
        ".chat-message__error-link",
      );
      expect(aiRepair).toBeDisabled();
    });
  });

  describe("retry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    const renderNetworkError = (lastAttemptAt?: number) =>
      render(ChatMessage, {
        message: makeMessage({
          error: "Network down",
          errorType: "network",
          lastAttemptAt,
        }),
        onRetry: () => {},
        isLastMessage: true,
      });

    it("is available right away when there was no previous attempt", async () => {
      renderNetworkError();
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.getByRole("button", { name: "Retry" })).not.toHaveClass(
        "invisible",
      );
    });

    it("stays hidden for 5s after the last attempt", async () => {
      renderNetworkError(Date.now());
      await vi.advanceTimersByTimeAsync(0);
      const retry = screen.getByRole("button", { name: "Retry" });
      expect(retry).toHaveClass("invisible");

      await vi.advanceTimersByTimeAsync(4900);
      expect(retry).toHaveClass("invisible");

      await vi.advanceTimersByTimeAsync(200);
      expect(retry).not.toHaveClass("invisible");
    });
  });

  describe("warnings", () => {
    const warning = (warningType: TChat.ChatMessage["warningType"]) =>
      makeMessage({ type: "warning", warningType, content: undefined });

    it("renders the general rate limit warning", () => {
      render(ChatMessage, { message: warning("rateLimitExceeded") });
      expect(document.querySelector(".chat-message")).toHaveClass(
        "chat-message--system",
      );
      expect(document.querySelector(".chat-message__role")).toHaveTextContent(
        "System",
      );
      expect(document.querySelector(".chat-message__text")).toHaveTextContent(
        "Hold your horses",
      );
    });

    it("renders the message limit warning as the general text, with no upsell (no paid plan exists)", () => {
      const open = vi.spyOn(window, "open").mockReturnValue(null);
      render(ChatMessage, { message: warning("messageLimitExceeded") });
      expect(document.querySelector(".chat-message__text")).toHaveTextContent(
        t("chat.rateLimit.generalRateLimit"),
      );
      expect(document.querySelector(".chat-message__text button")).toBeNull();
      expect(open).not.toHaveBeenCalled();
    });

    it("lets the host override the warning content", () => {
      const renderWarning = vi.fn(() => "custom");
      const message = warning("rateLimitExceeded");
      render(ChatMessage, { message, renderWarning });
      expect(renderWarning).toHaveBeenCalledWith(message);
      expect(document.querySelector(".chat-message__text")).toHaveTextContent(
        "custom",
      );
    });

    it("falls back to the default warning when the host returns nothing", () => {
      render(ChatMessage, {
        message: warning("rateLimitExceeded"),
        renderWarning: () => undefined,
      });
      expect(
        document.querySelector(".chat-message__text")?.textContent?.trim(),
      ).not.toBe("");
    });
  });
});
