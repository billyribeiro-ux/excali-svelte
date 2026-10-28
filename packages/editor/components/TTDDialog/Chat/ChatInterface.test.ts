import { fireEvent, render } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChatInterface from "./ChatInterface.svelte";

import type { TChat } from "../types";

const message = (
  id: string,
  overrides: Partial<TChat.ChatMessage> = {},
): TChat.ChatMessage => ({
  id,
  timestamp: new Date(2024, 0, 1, 10, 30),
  type: "user",
  content: id,
  ...overrides,
});

const baseProps = () => ({
  chatId: "chat-1",
  messages: [] as TChat.ChatMessage[],
  currentPrompt: "",
  onPromptChange: vi.fn(),
  onGenerate: vi.fn(async () => {}),
  isGenerating: false,
});

const input = () =>
  document.querySelector<HTMLTextAreaElement>(".chat-interface__input")!;
const send = () =>
  document.querySelector<HTMLButtonElement>(".chat-interface__send-button")!;

describe("<ChatInterface />", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("shows the welcome message when there are no messages", () => {
    render(ChatInterface, baseProps());
    expect(
      document.querySelector(".chat-interface__welcome-message, .chat-interface__welcome-screen__welcome-message"),
    ).not.toBeNull();
    expect(input()).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Shift + Enter"),
    );
  });

  it("renders messages instead of the welcome screen and scrolls to the end", () => {
    render(ChatInterface, {
      ...baseProps(),
      messages: [message("a"), message("b", { type: "assistant" })],
    });
    expect(document.querySelectorAll(".chat-message")).toHaveLength(2);
    expect(document.querySelector(".chat-interface__welcome-screen")).toBeNull();
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("reports prompt edits", async () => {
    const props = baseProps();
    render(ChatInterface, props);
    await fireEvent.input(input(), { target: { value: "hello there" } });
    expect(props.onPromptChange).toHaveBeenCalledWith("hello there");
  });

  it("enables send only for prompts longer than 3 characters", async () => {
    const { rerender } = render(ChatInterface, {
      ...baseProps(),
      currentPrompt: "abc",
    });
    expect(send()).toBeDisabled();
    await rerender({ currentPrompt: "abcd" });
    expect(send()).not.toBeDisabled();
  });

  it("submits the trimmed prompt and clears the box", async () => {
    const props = { ...baseProps(), currentPrompt: "  draw a graph  " };
    render(ChatInterface, props);
    await fireEvent.click(send());
    expect(props.onGenerate).toHaveBeenCalledWith({ prompt: "draw a graph" });
    expect(props.onPromptChange).toHaveBeenCalledWith("");
  });

  it("submits on Enter, but not on Shift+Enter", async () => {
    const props = { ...baseProps(), currentPrompt: "draw a graph" };
    render(ChatInterface, props);
    await fireEvent.keyDown(input(), { key: "Enter", shiftKey: true });
    expect(props.onGenerate).not.toHaveBeenCalled();
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(props.onGenerate).toHaveBeenCalledTimes(1);
  });

  it("turns the send button into a stop button while generating", async () => {
    const onAbort = vi.fn();
    const props = {
      ...baseProps(),
      currentPrompt: "",
      isGenerating: true,
      onAbort,
    };
    render(ChatInterface, props);
    expect(input()).toHaveAttribute("placeholder", "Generating...");
    expect(send()).not.toBeDisabled();
    await fireEvent.click(send());
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(props.onGenerate).not.toHaveBeenCalled();
    // Enter does not submit while generating
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(props.onGenerate).not.toHaveBeenCalled();
  });

  it("disables the input when the message limit is reached", () => {
    render(ChatInterface, {
      ...baseProps(),
      currentPrompt: "draw a graph",
      rateLimits: { rateLimit: 10, rateLimitRemaining: 0 },
    });
    expect(input()).toBeDisabled();
    expect(send()).toBeDisabled();
  });

  it("only allows fixing the parse error of the last message", () => {
    render(ChatInterface, {
      ...baseProps(),
      messages: [
        message("a", { type: "assistant", error: "x", errorType: "parse" }),
        message("b", { type: "assistant", error: "y", errorType: "parse" }),
      ],
      onMermaidTabClick: () => {},
      onAiRepairClick: () => {},
    });
    const messages = document.querySelectorAll(".chat-message");
    expect(messages[0].querySelector(".chat-message__error-link")).toBeNull();
    expect(messages[1].querySelector(".chat-message__error-link")).not.toBeNull();
  });

  it("focuses the input when the chat changes", async () => {
    const { rerender } = render(ChatInterface, baseProps());
    input().blur();
    expect(document.activeElement).not.toBe(input());
    await rerender({ chatId: "chat-2" });
    expect(document.activeElement).toBe(input());
  });
});
