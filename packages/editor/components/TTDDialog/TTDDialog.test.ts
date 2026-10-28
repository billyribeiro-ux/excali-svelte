import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_LS_KEYS } from "@svelte-draw/common";

import { EditorLocalStorage } from "../../data/EditorLocalStorage";
import { editorJotaiStore } from "../../editor-jotai";
import { mockMermaidToExcalidraw } from "../../tests/helpers/mocks";

import Harness from "./TTDDialogHarness.test.svelte";
import {
  chatHistoryAtom,
  errorAtom,
  rateLimitsAtom,
  showPreviewAtom,
} from "./TTDContext";
import {
  chatsLoadedAtom,
  isLoadingChatsAtom,
  savedChatsAtom,
} from "./useTTDChatStorage.svelte";

import type { TTDPersistenceAdapter, TTTDDialog } from "./types";

// CodeMirror can't be loaded -> the input falls back to a <textarea>
vi.mock("@codemirror/view", () => ({}));
vi.mock("@codemirror/state", () => ({}));
vi.mock("@codemirror/language", () => ({}));
vi.mock("@lezer/highlight", () => ({}));

vi.mock("../../analytics", () => ({ trackEvent: vi.fn() }));

// the real lib is replaced through a regular module mock (see helpers/mocks)
mockMermaidToExcalidraw({
  parseMermaidToExcalidraw: async (definition) => {
    const firstLine = definition.split("\n")[0];
    if (firstLine === "flowchart TD") {
      return { elements: [{ id: "a", type: "rectangle", x: 0, y: 0, width: 10, height: 10 }] } as any;
    }
    if (firstLine === "sequenceDiagram") {
      // a lazy diagram chunk failing to load (e.g. offline)
      throw new TypeError(
        "Failed to fetch dynamically imported module: http://localhost/assets/sequenceDiagram.js",
      );
    }
    throw new Error("Parse error on line 1: bogus");
  },
});

const resetAtoms = () => {
  editorJotaiStore.set(chatHistoryAtom, {
    id: "chat-1",
    messages: [],
    currentPrompt: "",
  });
  editorJotaiStore.set(errorAtom, null);
  editorJotaiStore.set(rateLimitsAtom, null);
  editorJotaiStore.set(showPreviewAtom, false);
  editorJotaiStore.set(savedChatsAtom, []);
  editorJotaiStore.set(chatsLoadedAtom, false);
  editorJotaiStore.set(isLoadingChatsAtom, false);
};

const makePersistenceAdapter = (): TTDPersistenceAdapter => ({
  loadChats: vi.fn(async () => []),
  saveChats: vi.fn(async () => {}),
});

const setup = ({
  tab = "text-to-diagram",
  onTextSubmit = vi.fn(async () => ({
    generatedResponse: "flowchart TD\n A-->B",
    error: null,
  })) as unknown as TTTDDialog.onTextSubmit,
  persistenceAdapter = makePersistenceAdapter(),
  ...ttdProps
}: Record<string, any> = {}) => {
  const onSetAppState = vi.fn();
  render(Harness, {
    ttdProps: { onTextSubmit, persistenceAdapter, ...ttdProps },
    initialAppState: { openDialog: { name: "ttd", tab } },
    onSetAppState,
  });
  return { onSetAppState, onTextSubmit, persistenceAdapter };
};

const getChatInput = () =>
  document.querySelector<HTMLTextAreaElement>(".chat-interface__input")!;
const getSendButton = () =>
  document.querySelector<HTMLButtonElement>(".chat-interface__send-button")!;

const sendPrompt = async (prompt: string) => {
  await fireEvent.input(getChatInput(), { target: { value: prompt } });
  await fireEvent.click(getSendButton());
};

describe("<TTDDialog />", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAtoms();
    // jsdom does not implement scrollIntoView (used to follow new messages)
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  describe("visibility", () => {
    it("renders nothing while another dialog is open", () => {
      render(Harness, {
        ttdProps: { __fallback: true },
        initialAppState: { openDialog: { name: "help" } },
      });
      expect(document.querySelector(".ttd-dialog")).toBeNull();
    });

    it("renders only the mermaid tab for the fallback instance", () => {
      render(Harness, { ttdProps: { __fallback: true } });
      expect(document.querySelector(".ttd-dialog")).not.toBeNull();
      expect(document.querySelector(".dialog-mermaid-title")).toHaveTextContent(
        "Mermaid to svelte-draw",
      );
      expect(document.querySelector(".ttd-dialog-triggers")).toBeNull();
      expect(document.querySelector(".chat-interface")).toBeNull();
    });
  });

  describe("tabs", () => {
    it("shows both tab triggers and marks the open tab as selected", () => {
      setup({ tab: "text-to-diagram" });
      const [textTrigger, mermaidTrigger] = screen.getAllByRole("tab");
      expect(textTrigger).toHaveTextContent("Text to diagram");
      expect(textTrigger).toHaveTextContent("Beta");
      expect(mermaidTrigger).toHaveTextContent("Mermaid");
      expect(textTrigger).toHaveAttribute("aria-selected", "true");
      expect(mermaidTrigger).toHaveAttribute("aria-selected", "false");
      expect(document.querySelector(".chat-interface")).not.toBeNull();
    });

    it("switches tabs through the app state", async () => {
      const { onSetAppState } = setup({ tab: "text-to-diagram" });
      const mermaidTrigger = screen.getByRole("tab", { name: "Mermaid" });

      await fireEvent.click(mermaidTrigger);

      expect(onSetAppState).toHaveBeenCalledWith({
        openDialog: { name: "ttd", tab: "mermaid" },
      });
      await waitFor(() =>
        expect(mermaidTrigger).toHaveAttribute("aria-selected", "true"),
      );
      const panels = document.querySelectorAll<HTMLElement>(
        '[role="tabpanel"]',
      );
      const active = [...panels].filter(
        (panel) => panel.getAttribute("data-state") === "active",
      );
      expect(active).toHaveLength(1);
      expect(active[0].querySelector(".ttd-dialog-desc")).not.toBeNull();
    });
  });

  describe("loading the mermaid lib", () => {
    const failChunk = async () => {
      const textarea = await waitFor(() => {
        const el = document.querySelector<HTMLTextAreaElement>(
          "textarea.ttd-dialog-input",
        );
        expect(el).not.toBeNull();
        return el!;
      });
      await fireEvent.input(textarea, { target: { value: "sequenceDiagram" } });
      await waitFor(() =>
        expect(
          document.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
        ).not.toBeNull(),
      );
    };

    let onLine: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // offline -> a retry may recover (online -> only a reload will)
      onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      setup({ tab: "mermaid" });
    });

    afterEach(() => {
      onLine.mockRestore();
    });

    it("asks for a page reload when the failure happened while online", async () => {
      onLine.mockReturnValue(true);
      await failChunk();
      expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    });

    it("retries loading from the load error", async () => {
      await failChunk();
      await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      // lib reloaded -> the preview is back (the failing definition is still
      // there, but the load error is gone)
      await waitFor(() =>
        expect(
          document.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
        ).toBeNull(),
      );
      await waitFor(() =>
        expect(
          document.querySelector(".ttd-dialog-output-canvas-container"),
        ).not.toBeNull(),
      );
    });

    it("retries automatically once the browser is back online", async () => {
      await failChunk();
      window.dispatchEvent(new Event("online"));
      await waitFor(() =>
        expect(
          document.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
        ).toBeNull(),
      );
    });
  });

  describe("text to diagram", () => {
    it("shows the welcome message until the first message", () => {
      setup();
      expect(
        document.querySelector(".chat-interface__welcome-screen__welcome-message"),
      ).not.toBeNull();
      expect(getSendButton()).toBeDisabled();
    });

    it("submits the prompt and shows the generated answer", async () => {
      const onTextSubmit = vi.fn(async ({ onChunk }) => {
        onChunk("flowchart TD\n");
        onChunk(" A-->B");
        return { generatedResponse: "flowchart TD\n A-->B", error: null };
      });
      setup({ onTextSubmit });

      await sendPrompt("draw a flowchart");

      await waitFor(() =>
        expect(document.querySelectorAll(".chat-message")).toHaveLength(2),
      );
      expect(onTextSubmit).toHaveBeenCalledTimes(1);
      expect(onTextSubmit.mock.calls[0][0].messages).toEqual([
        { role: "user", content: "draw a flowchart" },
      ]);
      expect(
        document.querySelector(".chat-message--user .chat-message__text"),
      ).toHaveTextContent("draw a flowchart");
      await waitFor(() =>
        expect(
          document.querySelector(".chat-message--assistant .chat-message__text"),
        ).toHaveTextContent("flowchart TD A-->B"),
      );
      // generation finished -> no streaming cursor, prompt box cleared
      expect(document.querySelector(".chat-message__cursor")).toBeNull();
      expect(getChatInput().value).toBe("");
      // the valid diagram is shown in the preview panel next to the chat
      await waitFor(() =>
        expect(document.querySelector(".ttd-dialog-layout--split")).not.toBeNull(),
      );
      expect(document.querySelector(".ttd-dialog-preview-panel")).not.toBeNull();
      // and no parse error is reported
      expect(document.querySelector(".chat-message__error")).toBeNull();
    });

    it("renders the streaming message with a cursor while generating", async () => {
      let finish!: () => void;
      const gate = new Promise<void>((resolve) => (finish = resolve));
      const onTextSubmit = vi.fn(async ({ onChunk }) => {
        onChunk("flowchart");
        await gate;
        return { generatedResponse: "flowchart TD\n A-->B", error: null };
      });
      setup({ onTextSubmit });

      await sendPrompt("draw a flowchart");

      await waitFor(() =>
        expect(document.querySelector(".chat-message__cursor")).not.toBeNull(),
      );
      expect(
        document.querySelector(".chat-message--assistant .chat-message__text"),
      ).toHaveTextContent("flowchart");
      // while generating the input shows the generating placeholder and the
      // send button turns into a stop button
      expect(getChatInput()).toHaveAttribute("placeholder", "Generating...");
      expect(getSendButton()).not.toBeDisabled();

      finish();
      await waitFor(() =>
        expect(document.querySelector(".chat-message__cursor")).toBeNull(),
      );
    });

    it("aborts the in-flight request with the stop button", async () => {
      let signal: AbortSignal | undefined;
      const onTextSubmit = vi.fn(
        (props: TTTDDialog.OnTextSubmitProps) =>
          new Promise<TTTDDialog.OnTextSubmitRetValue>((resolve) => {
            signal = props.signal;
            props.signal?.addEventListener("abort", () =>
              resolve({
                error: Object.assign(new Error("Aborted"), {
                  name: "AbortError",
                  status: 0,
                }) as any,
              }),
            );
          }),
      );
      setup({ onTextSubmit });

      await sendPrompt("draw a flowchart");
      await waitFor(() => expect(signal).toBeDefined());

      await fireEvent.click(getSendButton());

      expect(signal!.aborted).toBe(true);
      await waitFor(() =>
        expect(document.querySelector(".chat-message__cursor")).toBeNull(),
      );
      // an aborted request is not reported as an error
      expect(document.querySelector(".chat-message__error_message")).toBeNull();
    });

    it("shows the request error on the assistant message", async () => {
      const onTextSubmit = vi.fn(async () => ({
        error: Object.assign(new Error("Service unavailable"), { status: 503 }),
      })) as unknown as TTTDDialog.onTextSubmit;
      setup({ onTextSubmit });

      await sendPrompt("draw a flowchart");

      await waitFor(() =>
        expect(
          document.querySelector(".chat-message__error_message"),
        ).toHaveTextContent("Error: Service unavailable"),
      );
      // network errors can be retried, but not deleted
      expect(
        document.querySelector('.chat-message__action[aria-label="Retry"]'),
      ).not.toBeNull();
      expect(
        document.querySelector(
          '.chat-message__action[aria-label="Delete message"]',
        ),
      ).toBeNull();
    });

    it("offers fixing an invalid generated diagram", async () => {
      const onTextSubmit = vi.fn(async ({ onChunk }) => {
        onChunk("bogus diagram");
        return { generatedResponse: "bogus diagram", error: null };
      });
      const { onSetAppState } = setup({ onTextSubmit });

      await sendPrompt("draw something");

      await waitFor(() =>
        expect(
          document.querySelector(".chat-message__error_message"),
        ).not.toBeNull(),
      );
      expect(
        document.querySelector(".chat-message__error_message"),
      ).toHaveTextContent("Generated an invalid diagram");
      expect(document.querySelector(".chat-message__error")).toHaveTextContent(
        "bogus diagram",
      );
      const fixInMermaid = document.querySelector<HTMLButtonElement>(
        ".chat-message__error-link",
      )!;
      await fireEvent.click(fixInMermaid);
      // the broken definition is handed over to the mermaid tab
      expect(onSetAppState).toHaveBeenCalledWith({
        openDialog: { name: "ttd", tab: "mermaid" },
      });
      expect(
        EditorLocalStorage.get(EDITOR_LS_KEYS.MERMAID_TO_EXCALIDRAW),
      ).toBe("bogus diagram");
    });

    it("rejects prompts that are too short", async () => {
      const { onTextSubmit } = setup();
      await fireEvent.input(getChatInput(), { target: { value: "ab" } });
      // too short to send: the button stays disabled
      expect(getSendButton()).toBeDisabled();
      await fireEvent.keyDown(getChatInput(), { key: "Enter" });
      expect(onTextSubmit).not.toHaveBeenCalled();
    });

    it("submits with Enter but not with Shift+Enter", async () => {
      const { onTextSubmit } = setup();
      await fireEvent.input(getChatInput(), {
        target: { value: "draw a flowchart" },
      });

      await fireEvent.keyDown(getChatInput(), { key: "Enter", shiftKey: true });
      expect(onTextSubmit).not.toHaveBeenCalled();

      await fireEvent.keyDown(getChatInput(), { key: "Enter" });
      await waitFor(() => expect(onTextSubmit).toHaveBeenCalledTimes(1));
    });

    it("shows the rate limit warning and blocks input when the limit is reached", async () => {
      const onTextSubmit = vi.fn(async () => ({
        generatedResponse: "flowchart TD\n A-->B",
        error: null,
        rateLimit: 10,
        rateLimitRemaining: 0,
      })) as unknown as TTTDDialog.onTextSubmit;
      setup({ onTextSubmit });

      await sendPrompt("draw a flowchart");

      await waitFor(() =>
        expect(document.querySelector(".chat-message--system")).not.toBeNull(),
      );
      expect(getChatInput()).toBeDisabled();
      expect(
        document.querySelector(".ttd-dialog-panel__rate-limit"),
      ).not.toBeNull();
    });

    it("uses the host provided warning renderer", async () => {
      const onTextSubmit = vi.fn(async () => ({
        generatedResponse: "flowchart TD\n A-->B",
        error: null,
        rateLimit: 10,
        rateLimitRemaining: 0,
      })) as unknown as TTTDDialog.onTextSubmit;
      const renderWarning = vi.fn(() => "custom warning text");
      setup({ onTextSubmit, renderWarning });

      await sendPrompt("draw a flowchart");

      await waitFor(() =>
        expect(
          document.querySelector(".chat-message--system .chat-message__text"),
        ).toHaveTextContent("custom warning text"),
      );
      expect(renderWarning).toHaveBeenCalled();
    });

    it("uses the host provided welcome screen renderer", () => {
      const renderWelcomeScreen = vi.fn(() => "custom welcome");
      setup({ renderWelcomeScreen });
      expect(
        document.querySelector(".chat-interface__welcome-screen"),
      ).toHaveTextContent("custom welcome");
      expect(renderWelcomeScreen).toHaveBeenCalledWith({ rateLimits: null });
    });

    it("starts a new chat and keeps the previous one in the history", async () => {
      const { persistenceAdapter } = setup();
      await sendPrompt("draw a flowchart");
      await waitFor(() =>
        expect(document.querySelectorAll(".chat-message")).toHaveLength(2),
      );

      await fireEvent.click(screen.getByRole("button", { name: "New Chat" }));

      await waitFor(() =>
        expect(document.querySelectorAll(".chat-message")).toHaveLength(0),
      );
      expect(persistenceAdapter.saveChats).toHaveBeenCalled();
      const saved = (persistenceAdapter.saveChats as any).mock.calls.at(-1)[0];
      expect(saved).toHaveLength(1);
      expect(saved[0].title).toBe("draw a flowchart");
    });
  });
});
