import { untrack } from "svelte";

import type { NonDeletedExcalidrawElement, Theme } from "@svelte-draw/element/types";

import { useAtom } from "../../../editor-jotai";

import { chatHistoryAtom, errorAtom, showPreviewAtom } from "../TTDContext";
import { convertMermaidToExcalidraw } from "../common";
import { isValidMermaidSyntax } from "../utils/mermaidValidation";

import { getLastAssistantMessage } from "../utils/chat";

import type { BinaryFiles } from "../../../types";
import type { MermaidToExcalidrawLibProps } from "../types";

const FAST_THROTTLE_DELAY = 300;
const SLOW_THROTTLE_DELAY = 3000;
const RENDER_SPEED_THRESHOLD = 100;
const PARSE_FAIL_DELAY = 100;

interface UseMermaidRendererProps {
  getMermaidToExcalidrawLib: () => MermaidToExcalidrawLibProps;
  /** the element the preview canvas is rendered into (reactive `bind:this`) */
  getCanvas: () => HTMLDivElement | null;
  getTheme: () => Theme;
}

/**
 * Must be called during component initialization (registers effects).
 */
export const useMermaidRenderer = ({
  getMermaidToExcalidrawLib,
  getCanvas,
  getTheme,
}: UseMermaidRendererProps) => {
  const chatHistory = useAtom(chatHistoryAtom);
  const error = useAtom(errorAtom);
  const showPreview = useAtom(showPreviewAtom);

  const setError = (value: Error | null) => {
    error.current = value;
  };

  const canvasRef = {
    get current() {
      return getCanvas();
    },
  };

  let isRendering = false;

  const lastAssistantMessage = $derived(
    getLastAssistantMessage(chatHistory.current),
  );

  const data: {
    current: {
      elements: readonly NonDeletedExcalidrawElement[];
      files: BinaryFiles | null;
    };
  } = {
    current: {
      elements: [],
      files: null,
    },
  };

  let lastRenderTime = 0;
  let pendingContent: string | null = null;
  let hasErrorOffset = false;
  let currentThrottleDelay = FAST_THROTTLE_DELAY;

  const renderMermaid = async (mermaidDefinition: string): Promise<boolean> => {
    const mermaidToExcalidrawLib = getMermaidToExcalidrawLib();
    if (!mermaidDefinition.trim() || mermaidToExcalidrawLib.status !== "loaded") {
      return false;
    }

    if (isRendering) {
      return false;
    }

    isRendering = true;

    const renderStartTime = performance.now();

    let result;
    try {
      result = await convertMermaidToExcalidraw({
        canvasRef,
        data,
        mermaidToExcalidrawLib,
        setError,
        mermaidDefinition,
        theme: getTheme(),
      });
    } finally {
      isRendering = false;
    }

    const renderDuration = performance.now() - renderStartTime;

    if (renderDuration < RENDER_SPEED_THRESHOLD) {
      currentThrottleDelay = FAST_THROTTLE_DELAY;
    } else {
      currentThrottleDelay = SLOW_THROTTLE_DELAY;
    }

    return result.success;
  };

  const throttledRenderMermaid = async (content: string) => {
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime;
    const throttleDelay = currentThrottleDelay;

    if (!isValidMermaidSyntax(content)) {
      if (!hasErrorOffset) {
        lastRenderTime = Math.max(
          lastRenderTime,
          now - throttleDelay + PARSE_FAIL_DELAY,
        );
        hasErrorOffset = true;
      }
      pendingContent = content;
      return;
    }

    hasErrorOffset = false;

    if (timeSinceLastRender < throttleDelay) {
      pendingContent = content;
      return;
    }

    pendingContent = null;
    const success = await renderMermaid(content);
    lastRenderTime = Date.now();

    if (!success) {
      lastRenderTime = lastRenderTime - throttleDelay + PARSE_FAIL_DELAY;
      hasErrorOffset = true;
    }
  };

  const flushThrottledRender = async () => {
    if (pendingContent) {
      const content = pendingContent;
      pendingContent = null;
      await renderMermaid(content);
      lastRenderTime = Date.now();
    }
  };

  const resetThrottleState = () => {
    lastRenderTime = 0;
    pendingContent = null;
    hasErrorOffset = false;
    currentThrottleDelay = FAST_THROTTLE_DELAY;
  };

  // this effect is responsible for keep rendering during streaming
  $effect(() => {
    const content = lastAssistantMessage?.content;
    const isGenerating = lastAssistantMessage?.isGenerating;
    // a new lib / theme re-triggers rendering
    void getMermaidToExcalidrawLib();
    void getTheme();

    untrack(() => {
      if (content && isGenerating) {
        throttledRenderMermaid(content);
      } else if (!isGenerating) {
        flushThrottledRender();
        resetThrottleState();
        if (content) {
          throttledRenderMermaid(content);
        }
      }
    });
  });

  // render the last message if the user navigates between the existing chats
  $effect(() => {
    void chatHistory.current.id;
    void getMermaidToExcalidrawLib();
    void getTheme();
    const isPreviewShown = showPreview.current;

    untrack(() => {
      const msg = lastAssistantMessage;
      if (!msg?.content || msg.error) {
        return;
      }

      if (!isPreviewShown) {
        return;
      }

      renderMermaid(msg.content);
    });
  });

  $effect(() => {
    const messages = chatHistory.current.messages;
    const isPreviewShown = showPreview.current;
    const hasAssistantMessage = !!messages?.filter(
      (msg) => msg.type === "assistant",
    ).length;
    void getCanvas();

    untrack(() => {
      if (!hasAssistantMessage) {
        const canvasNode = canvasRef.current;
        if (canvasNode) {
          const parent = canvasNode.parentElement;
          if (parent) {
            parent.style.background = "";
            canvasNode.replaceChildren();
          }
        }
        showPreview.current = false;
      } else if (!isPreviewShown) {
        showPreview.current = true;
      }
    });
  });

  return {
    data,
  };
};
